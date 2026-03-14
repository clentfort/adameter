import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	INTERNAL_TABLE_IDS,
	MIGRATION_ROW_CELLS,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import { migrations, runMigrations } from './index';
import { MIGRATION_IDS } from './manifest';

const RENAME_MIGRATION_ID = '2026-03-01-rename-diaper-abnormalities-to-notes';
const REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID =
	'2026-03-07-remove-legacy-json-cells';
const NORMALIZE_DIAPER_ROWS_MIGRATION_ID =
	'2026-03-07-normalize-diaper-store-rows';
const NORMALIZE_ENTITY_ROWS_MIGRATION_ID =
	'2026-03-07-normalize-entity-store-rows';
const RENAME_EVENT_MIGRATION_ID = '2026-03-24-rename-event-description-to-notes';

describe('runMigrations', () => {
	it('keeps manifest ids in sync with registered migrations', () => {
		expect(migrations.map((migration) => migration.id)).toEqual(MIGRATION_IDS);
	});

	it('applies migrations, renames diaper abnormalities to notes, and stores metadata', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			abnormalities: 'Slight redness',
			containsStool: false,
			containsUrine: true,
			timestamp: '2026-03-01T08:00:00.000Z',
		});

		const result = runMigrations(store, { deviceId: 'device-1' });

		expect(result.appliedMigrationIds).toEqual([
			RENAME_MIGRATION_ID,
			RENAME_EVENT_MIGRATION_ID,
			REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID,
			NORMALIZE_DIAPER_ROWS_MIGRATION_ID,
			NORMALIZE_ENTITY_ROWS_MIGRATION_ID,
		]);
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
		expect(secondRun.skippedMigrationIds).toEqual([
			RENAME_MIGRATION_ID,
			RENAME_EVENT_MIGRATION_ID,
			REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID,
			NORMALIZE_DIAPER_ROWS_MIGRATION_ID,
			NORMALIZE_ENTITY_ROWS_MIGRATION_ID,
		]);
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

	it('removes legacy json cells from persisted rows', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.EVENTS, 'e1', {
			json: '{"title":"Legacy"}',
			startDate: '2026-03-01T08:00:00.000Z',
			title: 'Legacy',
			type: 'point',
		});

		const result = runMigrations(store);

		expect(result.appliedMigrationIds).toContain(
			REMOVE_LEGACY_JSON_CELLS_MIGRATION_ID,
		);
		expect(store.getCell(TABLE_IDS.EVENTS, 'e1', 'json')).toBeUndefined();
		expect(store.getCell(TABLE_IDS.EVENTS, 'e1', 'title')).toBe('Legacy');
	});

	it('normalizes imported diaper rows with blank optional cells', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', {
			costPerDiaper: '',
			deviceId: 'device-1',
			isReusable: false,
			name: 'Pampers',
			upfrontCost: '',
		});

		const result = runMigrations(store);

		expect(result.appliedMigrationIds).toContain(
			NORMALIZE_DIAPER_ROWS_MIGRATION_ID,
		);
		expect(store.getRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1')).toEqual({
			deviceId: 'device-1',
			isReusable: false,
			name: 'Pampers',
		});
	});

	it('normalizes imported event rows with blank optional cells', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.EVENTS, 'e1', {
			color: '#123456',
			description: '',
			startDate: '2026-03-07T08:00:00.000Z',
			title: 'Checkup',
			type: 'point',
		});

		const result = runMigrations(store);

		expect(result.appliedMigrationIds).toContain(
			NORMALIZE_ENTITY_ROWS_MIGRATION_ID,
		);
		expect(store.getRow(TABLE_IDS.EVENTS, 'e1')).toEqual({
			color: '#123456',
			startDate: '2026-03-07T08:00:00.000Z',
			title: 'Checkup',
			type: 'point',
		});
	});

	it('renames event description to notes', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.EVENTS, 'e1', {
			description: 'Previous description',
			startDate: '2026-03-01T08:00:00.000Z',
			title: 'Legacy',
			type: 'point',
		});

		const result = runMigrations(store);

		expect(result.appliedMigrationIds).toContain(RENAME_EVENT_MIGRATION_ID);
		expect(store.getCell(TABLE_IDS.EVENTS, 'e1', 'notes')).toBe(
			'Previous description',
		);
		expect(store.getCell(TABLE_IDS.EVENTS, 'e1', 'description')).toBeUndefined();
	});
});
