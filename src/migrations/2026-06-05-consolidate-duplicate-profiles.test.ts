import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import { consolidateDuplicateProfilesMigration } from './2026-06-05-consolidate-duplicate-profiles';

describe('consolidateDuplicateProfilesMigration', () => {
	it('keeps the duplicate with the most data and reassigns linked rows', () => {
		const store = createStore();
		const profile = {
			color: 'bg-pink-500',
			dob: '2024-01-01',
			name: 'Ada',
			optedOut: false,
			sex: 'girl',
		};
		store.setRow(TABLE_IDS.PROFILES, 'main-ada', profile);
		store.setRow(TABLE_IDS.PROFILES, 'duplicate-ada', {
			...profile,
			deviceId: 'other-device',
		});
		store.setRow(TABLE_IDS.PROFILES, 'noam', {
			...profile,
			name: 'Noam',
		});
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'main-entry', {
			profileId: 'main-ada',
			timestamp: '2026-01-01',
		});
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'duplicate-entry', {
			profileId: 'duplicate-ada',
			timestamp: '2026-01-02',
		});
		store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'main-feeding', {
			profileId: 'main-ada',
			startTime: '2026-01-01',
		});
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'duplicate-ada');

		expect(consolidateDuplicateProfilesMigration.migrate(store)).toBe(true);

		expect(store.getRowIds(TABLE_IDS.PROFILES).sort()).toEqual([
			'main-ada',
			'noam',
		]);
		expect(
			store.getCell(TABLE_IDS.DIAPER_CHANGES, 'duplicate-entry', 'profileId'),
		).toBe('main-ada');
		expect(store.getValue(STORE_VALUE_SELECTED_PROFILE_ID)).toBe('main-ada');
	});

	it('merges repeated empty opt-out profiles but leaves distinct babies alone', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.PROFILES, 'empty-a', { optedOut: true });
		store.setRow(TABLE_IDS.PROFILES, 'empty-b', {
			deviceId: 'other-device',
			optedOut: true,
		});
		store.setRow(TABLE_IDS.PROFILES, 'named', {
			name: 'Ada',
			optedOut: false,
		});

		consolidateDuplicateProfilesMigration.migrate(store);

		expect(store.getRowCount(TABLE_IDS.PROFILES)).toBe(2);
		expect(store.hasRow(TABLE_IDS.PROFILES, 'named')).toBe(true);
	});

	it('repairs rows from an old client using the matching legacy profile', () => {
		const store = createStore();
		const ada = {
			color: 'bg-pink-500',
			dob: '2024-01-01',
			name: 'Ada',
			optedOut: false,
			sex: 'girl',
		};
		store.setRow(TABLE_IDS.PROFILES, 'ada', ada);
		store.setRow(TABLE_IDS.PROFILES, 'noam', { ...ada, name: 'Noam' });
		store.setValue('profile', JSON.stringify(ada));
		store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'old-client-entry', {
			startTime: '2026-01-01T00:00:00.000Z',
		});

		expect(consolidateDuplicateProfilesMigration.migrate(store)).toBe(true);
		expect(
			store.getCell(
				TABLE_IDS.FEEDING_SESSIONS,
				'old-client-entry',
				'profileId',
			),
		).toBe('ada');
	});

	it('does not guess an owner for orphaned rows with distinct profiles', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.PROFILES, 'ada', { name: 'Ada' });
		store.setRow(TABLE_IDS.PROFILES, 'noam', { name: 'Noam' });
		store.setRow(TABLE_IDS.EVENTS, 'orphan', {
			startDate: '2026-01-01T00:00:00.000Z',
			title: 'Unknown owner',
			type: 'point',
		});

		expect(consolidateDuplicateProfilesMigration.migrate(store)).toBe(false);
		expect(store.hasCell(TABLE_IDS.EVENTS, 'orphan', 'profileId')).toBe(false);
	});

	it('does nothing when profiles are distinct', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.PROFILES, 'ada', { name: 'Ada' });
		store.setRow(TABLE_IDS.PROFILES, 'noam', { name: 'Noam' });

		expect(consolidateDuplicateProfilesMigration.migrate(store)).toBe(false);
	});
});
