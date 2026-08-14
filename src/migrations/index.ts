import type { Store } from 'tinybase';
import type {
	Migration,
	MigrationRunOptions,
	MigrationRunResult,
} from './types';
import {
	CURRENT_SCHEMA_VERSION,
	INTERNAL_TABLE_IDS,
	MIGRATION_ROW_CELLS,
	STORE_VALUE_SCHEMA_VERSION,
} from '@/lib/tinybase-sync/constants';
import { renameDiaperAbnormalitiesToNotesMigration } from './2026-03-01-rename-diaper-abnormalities-to-notes';
import { normalizeDiaperStoreRowsMigration } from './2026-03-07-normalize-diaper-store-rows';
import { normalizeEntityStoreRowsMigration } from './2026-03-07-normalize-entity-store-rows';
import { removeLegacyJsonCellsMigration } from './2026-03-07-remove-legacy-json-cells';
import { cleanupJunkDataMigration } from './2026-03-15-cleanup-junk-data';
import { renameEventDescriptionToNotesMigration } from './2026-03-24-rename-event-description-to-notes';
import { assignColorsToDiaperProductsMigration } from './2026-03-25-assign-colors-to-diaper-products';
import { multiBabySupportMigration } from './2026-04-01-multi-baby-support';
import { repairMissingProfileIdsMigration } from './2026-06-01-repair-missing-profile-ids';

/**
 * Ordered migration list (oldest -> newest).
 *
 * Keep this explicit and append-only.
 */
export const migrations: readonly Migration[] = [
	renameDiaperAbnormalitiesToNotesMigration,
	renameEventDescriptionToNotesMigration,
	removeLegacyJsonCellsMigration,
	normalizeDiaperStoreRowsMigration,
	normalizeEntityStoreRowsMigration,
	cleanupJunkDataMigration,
	assignColorsToDiaperProductsMigration,
	multiBabySupportMigration,
	repairMissingProfileIdsMigration,
];

export function runMigrations(
	store: Store,
	options: MigrationRunOptions = {},
): MigrationRunResult {
	const appliedMigrationIds: string[] = [];
	const skippedMigrationIds: string[] = [];
	let hasChanges = false;

	for (const migration of migrations) {
		if (store.hasRow(INTERNAL_TABLE_IDS.MIGRATIONS, migration.id)) {
			skippedMigrationIds.push(migration.id);
			continue;
		}

		let wasAlreadyApplied = false;
		store.transaction(() => {
			// Double-check inside transaction in case of concurrent runs
			if (store.hasRow(INTERNAL_TABLE_IDS.MIGRATIONS, migration.id)) {
				wasAlreadyApplied = true;
				return;
			}

			migration.migrate(store);

			const metadata: Record<string, string | number | boolean> = {
				[MIGRATION_ROW_CELLS.APPLIED_AT]: Date.now(),
				[MIGRATION_ROW_CELLS.DESCRIPTION]: migration.description,
			};

			if (options.deviceId) {
				metadata[MIGRATION_ROW_CELLS.APPLIED_BY_DEVICE_ID] = options.deviceId;
			}

			store.setRow(INTERNAL_TABLE_IDS.MIGRATIONS, migration.id, metadata);
		});

		if (wasAlreadyApplied) {
			skippedMigrationIds.push(migration.id);
			continue;
		}

		hasChanges = true;
		appliedMigrationIds.push(migration.id);
	}

	const existingSchemaVersion = store.getValue(STORE_VALUE_SCHEMA_VERSION);
	if (
		typeof existingSchemaVersion !== 'number' ||
		existingSchemaVersion < CURRENT_SCHEMA_VERSION
	) {
		store.setValue(STORE_VALUE_SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
	}

	return {
		appliedMigrationIds,
		hasChanges,
		skippedMigrationIds,
	};
}
