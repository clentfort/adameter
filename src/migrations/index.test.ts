import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	INTERNAL_TABLE_IDS,
	MIGRATION_ROW_CELLS,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import { runMigrations } from './index';

const RENAME_MIGRATION_ID = '2026-03-01-rename-diaper-abnormalities-to-notes';

describe('runMigrations', () => {
	it('applies migrations, renames diaper abnormalities to notes, and stores metadata', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			abnormalities: 'Slight redness',
			containsStool: false,
			containsUrine: true,
			timestamp: '2026-03-01T08:00:00.000Z',
		});

		const result = runMigrations(store, { deviceId: 'device-1' });

		expect(result.appliedMigrationIds).toEqual([RENAME_MIGRATION_ID]);
		expect(result.hasChanges).toBe(true);
		expect(result.skippedMigrationIds).toEqual([]);

		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'notes')).toBe(
			'Slight redness',
		);
		expect(
			store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'abnormalities'),
		).toBeUndefined();

		const migrationMetadata = store.getRow(
			INTERNAL_TABLE_IDS.MIGRATIONS,
			RENAME_MIGRATION_ID,
		);
		expect(typeof migrationMetadata[MIGRATION_ROW_CELLS.APPLIED_AT]).toBe(
			'number',
		);
		expect(migrationMetadata[MIGRATION_ROW_CELLS.APPLIED_BY_DEVICE_ID]).toBe(
			'device-1',
		);
		expect(migrationMetadata[MIGRATION_ROW_CELLS.DESCRIPTION]).toBeTypeOf(
			'string',
		);
	});

	it('is idempotent and skips migrations that were already applied', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			abnormalities: 'Legacy notes',
			containsStool: false,
			containsUrine: true,
			timestamp: '2026-03-01T08:00:00.000Z',
		});

		runMigrations(store, { deviceId: 'device-1' });
		const secondRun = runMigrations(store, { deviceId: 'device-2' });

		expect(secondRun.appliedMigrationIds).toEqual([]);
		expect(secondRun.hasChanges).toBe(false);
		expect(secondRun.skippedMigrationIds).toEqual([RENAME_MIGRATION_ID]);
		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'notes')).toBe(
			'Legacy notes',
		);
	});

	it('keeps existing notes when both legacy and new cells exist', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			abnormalities: 'Old value',
			containsStool: false,
			containsUrine: true,
			notes: 'New value',
			timestamp: '2026-03-01T08:00:00.000Z',
		});

		runMigrations(store);

		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'notes')).toBe(
			'New value',
		);
		expect(
			store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'abnormalities'),
		).toBeUndefined();
	});
});
