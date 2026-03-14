import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { cleanupJunkDataMigration } from './2026-03-15-cleanup-junk-data';

describe('cleanupJunkDataMigration', () => {
	it('removes unknown tables and values', () => {
		const store = createStore();
		store.setTable('unknownTable', { row1: { cell1: 'junk' } });
		store.setValue('unknownValue', 'junk');
		store.setTable(TABLE_IDS.DIAPER_CHANGES, {
			change1: { containsStool: true, containsUrine: true, timestamp: '2024-01-01T00:00:00Z' },
		});
		store.setValue('currency', 'USD');

		const hasChanges = cleanupJunkDataMigration.migrate(store);

		expect(hasChanges).toBe(true);
		expect(store.hasTable('unknownTable')).toBe(false);
		expect(store.hasValue('unknownValue')).toBe(false);
		expect(store.hasTable(TABLE_IDS.DIAPER_CHANGES)).toBe(true);
		expect(store.getValue('currency')).toBe('USD');
	});

	it('strips unknown cells from known tables using Zod schema', () => {
		const store = createStore();
		store.setTable(TABLE_IDS.DIAPER_CHANGES, {
			change1: {
				containsStool: true,
				containsUrine: true,
				d: 'junk-packed-row',
				json: '{"some":"legacy-data"}',
				rawJson: 'more junk',
				timestamp: '2024-01-01T00:00:00Z',
				unknownCell: 123,
			},
		});

		const hasChanges = cleanupJunkDataMigration.migrate(store);

		expect(hasChanges).toBe(true);
		const row = store.getRow(TABLE_IDS.DIAPER_CHANGES, 'change1');
		expect(row.d).toBeUndefined();
		expect(row.json).toBeUndefined();
		expect(row.rawJson).toBeUndefined();
		expect(row.unknownCell).toBeUndefined();
		expect(row.containsStool).toBe(true);
		expect(row.containsUrine).toBe(true);
		expect(row.timestamp).toBe('2024-01-01T00:00:00Z');
	});

	it('cleans up unknown keys in JSON values', () => {
		const store = createStore();
		const profileWithJunk = JSON.stringify({
			birthday: '2024-01-01',
			junkKey: 'delete me',
			name: 'Baby',
		});
		store.setValue('profile', profileWithJunk);

		const hasChanges = cleanupJunkDataMigration.migrate(store);

		expect(hasChanges).toBe(true);
		const cleanedValue = store.getValue('profile') as string;
		const cleanedProfile = JSON.parse(cleanedValue);
		expect(cleanedProfile.name).toBe('Baby');
		expect(cleanedProfile.birthday).toBe('2024-01-01');
		expect(cleanedProfile.junkKey).toBeUndefined();
	});

	it('removes rows that fail Zod validation', () => {
		const store = createStore();
		store.setTable(TABLE_IDS.DIAPER_CHANGES, {
			invalidChange: {
				// Missing required fields
				notes: 'no stool, no urine, no timestamp',
			},
			validChange: {
				containsStool: false,
				containsUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			},
		});

		const hasChanges = cleanupJunkDataMigration.migrate(store);

		expect(hasChanges).toBe(true);
		expect(store.hasRow(TABLE_IDS.DIAPER_CHANGES, 'invalidChange')).toBe(false);
		expect(store.hasRow(TABLE_IDS.DIAPER_CHANGES, 'validChange')).toBe(true);
	});
});
