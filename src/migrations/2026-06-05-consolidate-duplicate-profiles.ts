import type { Row, Store } from 'tinybase';
import type { Migration } from './types';
import {
	STORE_VALUE_PROFILE,
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';

const PROFILE_DATA_CELLS = [
	'birthday',
	'color',
	'dob',
	'name',
	'optedOut',
	'sex',
] as const;

const PROFILE_SCOPED_TABLE_IDS = [
	TABLE_IDS.DIAPER_CHANGES,
	TABLE_IDS.DIAPER_PRODUCTS,
	TABLE_IDS.EVENTS,
	TABLE_IDS.FEEDING_SESSIONS,
	TABLE_IDS.GROWTH_MEASUREMENTS,
	TABLE_IDS.TEETHING,
] as const;

function getProfileSignature(row: Row) {
	return JSON.stringify(
		Object.fromEntries(
			PROFILE_DATA_CELLS.filter((cellId) => row[cellId] !== undefined).map(
				(cellId) => [cellId, row[cellId]],
			),
		),
	);
}

function countLinkedRows(store: Store, profileId: string) {
	let count = 0;
	for (const tableId of PROFILE_SCOPED_TABLE_IDS) {
		for (const rowId of store.getRowIds(tableId)) {
			if (store.getCell(tableId, rowId, 'profileId') === profileId) {
				count++;
			}
		}
	}
	return count;
}

function findProfileForOrphanedRows(store: Store) {
	const profileIds = store.getRowIds(TABLE_IDS.PROFILES);
	const legacyProfile = store.getValue(STORE_VALUE_PROFILE);
	if (typeof legacyProfile === 'string') {
		try {
			const legacySignature = getProfileSignature(JSON.parse(legacyProfile));
			const matchingProfileIds = profileIds.filter(
				(profileId) =>
					getProfileSignature(store.getRow(TABLE_IDS.PROFILES, profileId)) ===
					legacySignature,
			);
			if (matchingProfileIds.length === 1) {
				return matchingProfileIds[0];
			}
		} catch {
			// Ignore malformed legacy profile values.
		}
	}

	return profileIds.length === 1 ? profileIds[0] : undefined;
}

export function repairMissingProfileIds(store: Store) {
	const profileId = findProfileForOrphanedRows(store);
	if (!profileId) return false;

	let hasChanges = false;
	store.transaction(() => {
		for (const tableId of PROFILE_SCOPED_TABLE_IDS) {
			for (const rowId of store.getRowIds(tableId)) {
				const existingProfileId = store.getCell(tableId, rowId, 'profileId');
				if (typeof existingProfileId !== 'string' || existingProfileId === '') {
					store.setCell(tableId, rowId, 'profileId', profileId);
					hasChanges = true;
				}
			}
		}
	});
	return hasChanges;
}

export const consolidateDuplicateProfilesMigration: Migration = {
	description:
		'Consolidate duplicate profiles and repair rows from legacy clients.',
	id: '2026-06-05-consolidate-duplicate-profiles',
	migrate: (store) => {
		const groups = new Map<string, string[]>();
		for (const profileId of store.getRowIds(TABLE_IDS.PROFILES)) {
			const signature = getProfileSignature(
				store.getRow(TABLE_IDS.PROFILES, profileId),
			);
			groups.set(signature, [...(groups.get(signature) ?? []), profileId]);
		}

		let hasChanges = false;
		store.transaction(() => {
			for (const profileIds of groups.values()) {
				if (profileIds.length < 2) continue;

				const [canonicalProfileId, ...duplicateProfileIds] = [...profileIds]
					.map((profileId) => ({
						linkedRows: countLinkedRows(store, profileId),
						profileId,
					}))
					.sort(
						(left, right) =>
							right.linkedRows - left.linkedRows ||
							left.profileId.localeCompare(right.profileId),
					)
					.map(({ profileId }) => profileId);
				const duplicateIds = new Set(duplicateProfileIds);

				for (const tableId of PROFILE_SCOPED_TABLE_IDS) {
					for (const rowId of store.getRowIds(tableId)) {
						const profileId = store.getCell(tableId, rowId, 'profileId');
						if (typeof profileId === 'string' && duplicateIds.has(profileId)) {
							store.setCell(tableId, rowId, 'profileId', canonicalProfileId);
							hasChanges = true;
						}
					}
				}

				if (
					duplicateIds.has(
						String(store.getValue(STORE_VALUE_SELECTED_PROFILE_ID)),
					)
				) {
					store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, canonicalProfileId);
					hasChanges = true;
				}

				for (const duplicateProfileId of duplicateProfileIds) {
					store.delRow(TABLE_IDS.PROFILES, duplicateProfileId);
					hasChanges = true;
				}
			}
		});

		return repairMissingProfileIds(store) || hasChanges;
	},
};
