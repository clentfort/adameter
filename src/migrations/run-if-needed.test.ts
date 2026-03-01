import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { INTERNAL_TABLE_IDS, TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { hasPendingMigrations, runMigrationsIfNeeded } from './run-if-needed';

const RENAME_MIGRATION_ID = '2026-03-01-rename-diaper-abnormalities-to-notes';

describe('runMigrationsIfNeeded', () => {
	it('detects pending migrations from migration metadata', () => {
		const store = createStore();
		expect(hasPendingMigrations(store)).toBe(true);

		store.setRow(INTERNAL_TABLE_IDS.MIGRATIONS, RENAME_MIGRATION_ID, {
			appliedAt: Date.now(),
			description: 'already applied',
		});
		expect(hasPendingMigrations(store)).toBe(false);
	});

	it('returns quickly when latest migration is already applied', async () => {
		const store = createStore();
		store.setRow(INTERNAL_TABLE_IDS.MIGRATIONS, RENAME_MIGRATION_ID, {
			appliedAt: Date.now(),
			description: 'already applied',
		});

		const result = await runMigrationsIfNeeded(store, {
			deviceId: 'device-fast-path',
		});

		expect(result).toEqual({
			appliedMigrationIds: [],
			hasChanges: false,
			skippedMigrationIds: [],
		});
	});

	it('loads and applies migrations when metadata is missing', async () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			abnormalities: 'Legacy note',
			containsStool: false,
			containsUrine: true,
			timestamp: '2026-03-01T08:00:00.000Z',
		});

		const result = await runMigrationsIfNeeded(store, {
			deviceId: 'device-migrate',
		});

		expect(result.appliedMigrationIds).toEqual([RENAME_MIGRATION_ID]);
		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'notes')).toBe(
			'Legacy note',
		);
		expect(
			store.hasRow(INTERNAL_TABLE_IDS.MIGRATIONS, RENAME_MIGRATION_ID),
		).toBe(true);
	});
});
