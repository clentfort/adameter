import type { Migration } from './types';
import {
	STORE_VALUE_PROFILE,
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';

export const multiBabySupportMigration: Migration = {
	description: 'Move profile from global value to profiles table and link all data',
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

		const profileId = crypto.randomUUID();

		// Add profile to table
		store.setRow(TABLE_IDS.PROFILES, profileId, {
			...profileData,
			id: profileId,
		});

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
