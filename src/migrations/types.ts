import type { Store } from 'tinybase';

export interface Migration {
	description: string;
	id: string;
	/**
	 * Must be idempotent and safe to run on multiple devices concurrently.
	 * In multiplayer scenarios, two clients can temporarily run the same migration
	 * before migration metadata converges through sync.
	 */
	migrate: (store: Store) => boolean;
}

export interface MigrationRunOptions {
	deviceId?: string;
}

export interface MigrationRunResult {
	appliedMigrationIds: string[];
	hasChanges: boolean;
	skippedMigrationIds: string[];
}
