import { createMergeableStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	STORE_VALUE_PROFILE,
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import { multiBabySupportMigration } from './2026-04-01-multi-baby-support';

describe('multiBabySupportMigration', () => {
	it('moves profile from value to table and links data', () => {
		const store = createMergeableStore();
		const profileData = {
			color: 'bg-blue-500',
			dob: '2023-01-01',
			name: 'Baby One',
			sex: 'boy',
		};

		store.setValue(STORE_VALUE_PROFILE, JSON.stringify(profileData));
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'dc1', {
			timestamp: '2023-01-01T10:00:00Z',
		});
		store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'fs1', {
			startTime: '2023-01-01T11:00:00Z',
		});

		multiBabySupportMigration.migrate(store);

		const selectedProfileId = store.getValue(
			STORE_VALUE_SELECTED_PROFILE_ID,
		) as string;
		expect(selectedProfileId).toBeDefined();
		expect(typeof selectedProfileId).toBe('string');

		const profileRow = store.getRow(TABLE_IDS.PROFILES, selectedProfileId);
		expect(profileRow.name).toBe('Baby One');
		expect(profileRow.id).toBe(selectedProfileId);

		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'dc1', 'profileId')).toBe(
			selectedProfileId,
		);
		expect(store.getCell(TABLE_IDS.FEEDING_SESSIONS, 'fs1', 'profileId')).toBe(
			selectedProfileId,
		);
	});

	it('does nothing if no profile value exists', () => {
		const store = createMergeableStore();
		multiBabySupportMigration.migrate(store);

		expect(store.hasValue(STORE_VALUE_SELECTED_PROFILE_ID)).toBe(false);
		expect(store.getRowCount(TABLE_IDS.PROFILES)).toBe(0);
	});
});
