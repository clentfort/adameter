import type { Store } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { logger } from '@/lib/logger';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import {
	isLocalStoreDbName,
	isRoomSyncStateDbName,
	TINYBASE_LOCAL_DB_NAME,
} from './constants';
import {
	getLocalDbName,
	getLocalStoreId,
	rotateLocalStore,
} from './local-store-id';

const LOCAL_RESET_CHANNEL = 'adameter-local-data-reset';

/** Rejects if the backup could not be saved, e.g. because storage is full. */
export const backupLocalStore = async (store: Store): Promise<void> => {
	const backupDbName = `${TINYBASE_LOCAL_DB_NAME}-backup-${Date.now()}`;
	// TinyBase persisters report failures here instead of rejecting.
	let saveError: unknown;
	const backupPersister = createIndexedDbPersister(
		store,
		backupDbName,
		undefined,
		(error: unknown) => {
			saveError = error;
		},
	);
	await backupPersister.save();
	await backupPersister.destroy();
	if (saveError !== undefined) {
		throw new Error('Failed to back up the local store', { cause: saveError });
	}
};

/**
 * Starts from an empty local store on the next load and tells other tabs to
 * reload. The caller reloads the app afterwards.
 *
 * Local data is never cleared by deleting rows: deletions get new timestamps
 * and would be synced, wiping the room on every device if this device joins
 * it again. A fresh store syncs nothing.
 */
export function resetLocalData(): void {
	rotateLocalStore();
	if (typeof BroadcastChannel === 'undefined') return;
	const channel = new BroadcastChannel(LOCAL_RESET_CHANNEL);
	channel.postMessage('reset');
	channel.close();
}

export const backupAndClearLocalStore = async (store: Store): Promise<void> => {
	await backupLocalStore(store);
	resetLocalData();
};

/**
 * Calls `onReset` when another tab resets the local data. Returns a function
 * that stops listening.
 */
export function onLocalDataReset(onReset: () => void): () => void {
	if (typeof BroadcastChannel === 'undefined') return () => {};
	const channel = new BroadcastChannel(LOCAL_RESET_CHANNEL);
	channel.addEventListener('message', onReset);
	return () => channel.close();
}

/**
 * Deletes local stores and sync state left behind by earlier resets. Best
 * effort: a database that another tab still has open is deleted once that tab
 * closes it.
 */
export async function deleteObsoleteLocalDatabases(): Promise<void> {
	if (
		typeof indexedDB === 'undefined' ||
		typeof indexedDB.databases !== 'function'
	) {
		return;
	}
	// Without a recorded database name, the current store is the original one
	// and nothing is known to be obsolete.
	if (!getItem(STORAGE_KEYS.LOCAL_DB_NAME)) return;

	const currentDbName = getLocalDbName();
	const currentStoreId = getLocalStoreId();
	try {
		for (const { name } of await indexedDB.databases()) {
			if (!name || name === currentDbName) continue;
			const isObsoleteStore =
				name === TINYBASE_LOCAL_DB_NAME || isLocalStoreDbName(name);
			const isObsoleteSyncState =
				isRoomSyncStateDbName(name) &&
				!name.startsWith(`${TINYBASE_LOCAL_DB_NAME}-sync-${currentStoreId}-`);
			if (isObsoleteStore || isObsoleteSyncState) {
				indexedDB.deleteDatabase(name);
			}
		}
	} catch (error) {
		logger.warn('Failed to delete obsolete local databases:', error);
	}
}
