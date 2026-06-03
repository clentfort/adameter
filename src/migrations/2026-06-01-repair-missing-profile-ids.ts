import type { Migration } from './types';
import {
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';

export const repairMissingProfileIdsMigration: Migration = {
	description: 'Repair missing profileId in profile-scoped tables.',
	id: '2026-06-01-repair-missing-profile-ids',
	migrate: (store) => {
		const profileIds = store.getRowIds(TABLE_IDS.PROFILES);
		let canonicalProfileId: string | undefined;

		if (profileIds.length === 1) {
			canonicalProfileId = profileIds[0];
		} else {
			const selectedProfileId = store.getValue(STORE_VALUE_SELECTED_PROFILE_ID);
			if (
				typeof selectedProfileId === 'string' &&
				selectedProfileId !== '' &&
				profileIds.includes(selectedProfileId)
			) {
				canonicalProfileId = selectedProfileId;
			}
		}

		if (!canonicalProfileId) {
			return false;
		}

		let hasChanges = false;

		// Ensure selectedProfileId is set if it's currently missing
		const currentSelected = store.getValue(STORE_VALUE_SELECTED_PROFILE_ID);
		if (typeof currentSelected !== 'string' || currentSelected === '') {
			store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, canonicalProfileId);
			hasChanges = true;
		}

		const tablesToUpdate = [
			TABLE_IDS.DIAPER_CHANGES,
			TABLE_IDS.DIAPER_PRODUCTS,
			TABLE_IDS.EVENTS,
			TABLE_IDS.FEEDING_SESSIONS,
			TABLE_IDS.GROWTH_MEASUREMENTS,
			TABLE_IDS.TEETHING,
		];

		store.transaction(() => {
			for (const tableId of tablesToUpdate) {
				const rowIds = store.getRowIds(tableId);
				for (const rowId of rowIds) {
					const existingProfileId = store.getCell(tableId, rowId, 'profileId');
					if (
						typeof existingProfileId !== 'string' ||
						existingProfileId === ''
					) {
						store.setCell(tableId, rowId, 'profileId', canonicalProfileId);
						hasChanges = true;
					}
				}
			}
		});

		return hasChanges;
	},
};
