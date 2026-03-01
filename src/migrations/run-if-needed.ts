import type { Store } from 'tinybase';
import type { MigrationRunOptions, MigrationRunResult } from './types';
import { INTERNAL_TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { LATEST_MIGRATION_ID } from './manifest';

const EMPTY_RESULT: MigrationRunResult = {
	appliedMigrationIds: [],
	hasChanges: false,
	skippedMigrationIds: [],
};

export function hasPendingMigrations(store: Store): boolean {
	if (!LATEST_MIGRATION_ID) {
		return false;
	}

	return !store.hasRow(INTERNAL_TABLE_IDS.MIGRATIONS, LATEST_MIGRATION_ID);
}

export async function runMigrationsIfNeeded(
	store: Store,
	options: MigrationRunOptions = {},
): Promise<MigrationRunResult> {
	if (!hasPendingMigrations(store)) {
		return EMPTY_RESULT;
	}

	const { runMigrations } = await import('./index');
	return runMigrations(store, options);
}
