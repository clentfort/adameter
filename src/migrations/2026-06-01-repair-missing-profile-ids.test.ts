import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import { repairMissingProfileIdsMigration } from './2026-06-01-repair-missing-profile-ids';

describe('repairMissingProfileIdsMigration', () => {
	it('should backfill profileId when exactly one profile exists', () => {
		const store = createStore();
		const profileId = 'p1';
		store.setRow(TABLE_IDS.PROFILES, profileId, {
			id: profileId,
			name: 'Baby',
		});

		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', { timestamp: '2026-01-01' });
		store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
			profileId: '',
			timestamp: '2026-01-01',
		});

		repairMissingProfileIdsMigration.migrate(store);

		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'profileId')).toBe(
			profileId,
		);
		expect(store.getCell(TABLE_IDS.FEEDING_SESSIONS, 'f1', 'profileId')).toBe(
			profileId,
		);
		expect(store.getValue(STORE_VALUE_SELECTED_PROFILE_ID)).toBe(profileId);
	});

	it('should backfill profileId when multiple profiles exist but selectedProfileId is set', () => {
		const store = createStore();
		const p1 = 'p1';
		const p2 = 'p2';
		store.setRow(TABLE_IDS.PROFILES, p1, { id: p1, name: 'Baby 1' });
		store.setRow(TABLE_IDS.PROFILES, p2, { id: p2, name: 'Baby 2' });
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, p2);

		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', { timestamp: '2026-01-01' });

		repairMissingProfileIdsMigration.migrate(store);

		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'profileId')).toBe(p2);
	});

	it('should not backfill when multiple profiles exist and no valid selectedProfileId', () => {
		const store = createStore();
		const p1 = 'p1';
		const p2 = 'p2';
		store.setRow(TABLE_IDS.PROFILES, p1, { id: p1, name: 'Baby 1' });
		store.setRow(TABLE_IDS.PROFILES, p2, { id: p2, name: 'Baby 2' });

		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', { timestamp: '2026-01-01' });

		const result = repairMissingProfileIdsMigration.migrate(store);

		expect(result).toBe(false);
		expect(store.hasCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'profileId')).toBe(
			false,
		);
	});

	it('should not overwrite existing non-empty profileId', () => {
		const store = createStore();
		const p1 = 'p1';
		const p2 = 'p2';
		store.setRow(TABLE_IDS.PROFILES, p1, { id: p1, name: 'Baby 1' });
		store.setRow(TABLE_IDS.PROFILES, p2, { id: p2, name: 'Baby 2' });
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, p1);

		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			profileId: p2,
			timestamp: '2026-01-01',
		});

		repairMissingProfileIdsMigration.migrate(store);

		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'profileId')).toBe(p2);
	});
});
