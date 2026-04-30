import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { INTERNAL_TABLE_IDS, TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { hasPendingMigrations, runMigrationsIfNeeded } from './run-if-needed';

const RENAME_MIGRATION_ID = '2026-03-01-rename-diaper-abnormalities-to-notes';
const REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID =
	'2026-03-07-remove-legacy-json-cells';
const NORMALIZE_DIAPER_ROWS_MIGRATION_ID =
	'2026-03-07-normalize-diaper-store-rows';
const NORMALIZE_ENTITY_ROWS_MIGRATION_ID =
	'2026-03-07-normalize-entity-store-rows';
const CLEANUP_JUNK_DATA_MIGRATION_ID = '2026-03-15-cleanup-junk-data';
const RENAME_EVENT_MIGRATION_ID =
	'2026-03-24-rename-event-description-to-notes';
const ASSIGN_COLORS_MIGRATION_ID =
	'2026-03-25-assign-colors-to-diaper-products';
const MULTI_BABY_SUPPORT_MIGRATION_ID = '2026-04-01-multi-baby-support';

describe('runMigrationsIfNeeded', () => {
	it('detects pending migrations from migration metadata', () => {
		const store = createStore();
		expect(hasPendingMigrations(store)).toBe(true);

		for (const id of [
			RENAME_MIGRATION_ID,
			RENAME_EVENT_MIGRATION_ID,
			REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID,
			NORMALIZE_DIAPER_ROWS_MIGRATION_ID,
			NORMALIZE_ENTITY_ROWS_MIGRATION_ID,
			CLEANUP_JUNK_DATA_MIGRATION_ID,
			ASSIGN_COLORS_MIGRATION_ID,
			MULTI_BABY_SUPPORT_MIGRATION_ID,
		]) {
			store.setRow(INTERNAL_TABLE_IDS.MIGRATIONS, id, {
				appliedAt: Date.now(),
				description: 'already applied',
			});
		}
		expect(hasPendingMigrations(store)).toBe(false);
	});

	it('returns quickly when all migrations are already applied', async () => {
		const store = createStore();
		for (const id of [
			RENAME_MIGRATION_ID,
			RENAME_EVENT_MIGRATION_ID,
			REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID,
			NORMALIZE_DIAPER_ROWS_MIGRATION_ID,
			NORMALIZE_ENTITY_ROWS_MIGRATION_ID,
			CLEANUP_JUNK_DATA_MIGRATION_ID,
			ASSIGN_COLORS_MIGRATION_ID,
			MULTI_BABY_SUPPORT_MIGRATION_ID,
		]) {
			store.setRow(INTERNAL_TABLE_IDS.MIGRATIONS, id, {
				appliedAt: Date.now(),
				description: 'already applied',
			});
		}

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

		expect(result.appliedMigrationIds).toEqual([
			RENAME_MIGRATION_ID,
			RENAME_EVENT_MIGRATION_ID,
			REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID,
			NORMALIZE_DIAPER_ROWS_MIGRATION_ID,
			NORMALIZE_ENTITY_ROWS_MIGRATION_ID,
			CLEANUP_JUNK_DATA_MIGRATION_ID,
			ASSIGN_COLORS_MIGRATION_ID,
			MULTI_BABY_SUPPORT_MIGRATION_ID,
		]);
		expect(store.getCell(TABLE_IDS.DIAPER_CHANGES, 'd1', 'notes')).toBe(
			'Legacy note',
		);
		expect(
			store.hasRow(INTERNAL_TABLE_IDS.MIGRATIONS, RENAME_MIGRATION_ID),
		).toBe(true);
		expect(
			store.hasRow(
				INTERNAL_TABLE_IDS.MIGRATIONS,
				REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID,
			),
		).toBe(true);
		expect(
			store.hasRow(
				INTERNAL_TABLE_IDS.MIGRATIONS,
				NORMALIZE_DIAPER_ROWS_MIGRATION_ID,
			),
		).toBe(true);
		expect(
			store.hasRow(
				INTERNAL_TABLE_IDS.MIGRATIONS,
				NORMALIZE_ENTITY_ROWS_MIGRATION_ID,
			),
		).toBe(true);
		expect(
			store.hasRow(
				INTERNAL_TABLE_IDS.MIGRATIONS,
				CLEANUP_JUNK_DATA_MIGRATION_ID,
			),
		).toBe(true);
		expect(
			store.hasRow(INTERNAL_TABLE_IDS.MIGRATIONS, ASSIGN_COLORS_MIGRATION_ID),
		).toBe(true);
		expect(
			store.hasRow(INTERNAL_TABLE_IDS.MIGRATIONS, MULTI_BABY_SUPPORT_MIGRATION_ID),
		).toBe(true);
	});

	it('cleans existing diaper product rows with blank optional values', async () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', {
			costPerDiaper: '',
			deviceId: 'device-1',
			isReusable: false,
			name: 'Pampers',
			upfrontCost: '',
		});

		await runMigrationsIfNeeded(store, {
			deviceId: 'device-cleanup',
		});

		expect(store.getRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1')).toEqual({
			color: '#3b82f6',
			deviceId: 'device-1',
			isReusable: false,
			name: 'Pampers',
		});
	});

	it('removes legacy json cells from existing rows', async () => {
		const store = createStore();
		store.setRow(TABLE_IDS.EVENTS, 'e1', {
			json: '{"title":"Legacy"}',
			startDate: '2026-03-01T08:00:00.000Z',
			title: 'Legacy',
			type: 'point',
		});

		await runMigrationsIfNeeded(store, {
			deviceId: 'device-json-cleanup',
		});

		expect(store.getCell(TABLE_IDS.EVENTS, 'e1', 'json')).toBeUndefined();
		expect(store.getCell(TABLE_IDS.EVENTS, 'e1', 'title')).toBe('Legacy');
	});

	it('normalizes invalid optional cells for non-diaper entities', async () => {
		const store = createStore();
		store.setRow(TABLE_IDS.EVENTS, 'e1', {
			color: '#123456',
			notes: '',
			startDate: '2026-03-07T08:00:00.000Z',
			title: 'Checkup',
			type: 'point',
		});

		await runMigrationsIfNeeded(store, {
			deviceId: 'device-entity-cleanup',
		});

		expect(store.getRow(TABLE_IDS.EVENTS, 'e1')).toEqual({
			color: '#123456',
			startDate: '2026-03-07T08:00:00.000Z',
			title: 'Checkup',
			type: 'point',
		});
	});
});
