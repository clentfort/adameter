import type { Migration } from './types';
import {
	STORE_VALUE_PROFILE,
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';

function stableStringify(value: Record<string, unknown>) {
	return JSON.stringify(
		Object.fromEntries(
			Object.entries(value).sort(([left], [right]) =>
				left.localeCompare(right),
			),
		),
	);
}

function hashLegacyProfile(profile: Record<string, unknown>) {
	const serialized = stableStringify(profile);
	let firstHash = 0x81_1c_9d_c5;
	let secondHash = 0x9e_37_79_b9;

	for (let index = 0; index < serialized.length; index++) {
		const character = serialized.charCodeAt(index);
		firstHash = Math.imul(firstHash ^ character, 0x01_00_01_93);
		secondHash = Math.imul(secondHash ^ character, 0x85_eb_ca_6b);
	}

	return `legacy-${(firstHash >>> 0).toString(16).padStart(8, '0')}${(
		secondHash >>> 0
	)
		.toString(16)
		.padStart(8, '0')}`;
}

export const multiBabySupportMigration: Migration = {
	description:
		'Move profile from global value to profiles table and link all data',
	id: '2026-04-01-multi-baby-support',
	migrate: (store) => {
		const profileValue = store.getValue(STORE_VALUE_PROFILE);
		if (typeof profileValue !== 'string' || profileValue === '') {
			return false;
		}

		let profileData;
		try {
			profileData = JSON.parse(profileValue);
		} catch {
			return false;
		}

		if (!profileData || typeof profileData !== 'object') {
			return false;
		}

		const profileId = hashLegacyProfile(profileData as Record<string, unknown>);

		// A deterministic ID ensures that two devices migrating the same legacy
		// room offline converge on one profile instead of creating duplicates.
		store.setRow(TABLE_IDS.PROFILES, profileId, profileData);

		// Set selected profile ID
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, profileId);

		// Update all existing records with profileId
		const tablesToUpdate = [
			TABLE_IDS.DIAPER_CHANGES,
			TABLE_IDS.DIAPER_PRODUCTS,
			TABLE_IDS.EVENTS,
			TABLE_IDS.FEEDING_SESSIONS,
			TABLE_IDS.GROWTH_MEASUREMENTS,
			TABLE_IDS.TEETHING,
		];

		for (const tableId of tablesToUpdate) {
			const rowIds = store.getRowIds(tableId);
			for (const rowId of rowIds) {
				if (!store.hasCell(tableId, rowId, 'profileId')) {
					store.setCell(tableId, rowId, 'profileId', profileId);
				}
			}
		}

		return true;
	},
};
