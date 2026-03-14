import type { Store } from 'tinybase';
import type { MigrationRunOptions, MigrationRunResult } from './types';
import { INTERNAL_TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { MIGRATION_IDS } from './manifest';

const EMPTY_RESULT: MigrationRunResult = {
	appliedMigrationIds: [],
	hasChanges: false,
	skippedMigrationIds: [],
};

export function hasPendingMigrations(store: Store): boolean {
	return MIGRATION_IDS.some(
		(id) => !store.hasRow(INTERNAL_TABLE_IDS.MIGRATIONS, id),
	);
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
