import type { Store } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { logger } from '@/lib/logger';
import { getItem, removeItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { isRoomSyncStateDbName, TINYBASE_LOCAL_DB_NAME } from './constants';
import { rotateLocalStoreId } from './local-store-id';

export const backupLocalStore = async (store: Store): Promise<void> => {
	const backupDbName = `${TINYBASE_LOCAL_DB_NAME}-backup-${Date.now()}`;
	const backupPersister = createIndexedDbPersister(store, backupDbName);
	await backupPersister.save();
	await backupPersister.destroy();
};

/**
 * Marks the local data for removal on the next app start. The caller reloads
 * the app afterwards.
 *
 * Local data is never cleared by deleting rows: deletions get new timestamps
 * and would be synced, wiping the room on every device if this device joins
 * it again. Starting from a fresh store instead syncs nothing.
 */
export function requestLocalDataReset(): void {
	setItem(STORAGE_KEYS.LOCAL_DATA_RESET_PENDING, '1');
}

export const backupAndClearLocalStore = async (store: Store): Promise<void> => {
	await backupLocalStore(store);
	requestLocalDataReset();
};

function requestToPromise<Result>(
	request: IDBRequest<Result>,
): Promise<Result> {
	return new Promise((resolve, reject) => {
		request.addEventListener('success', () => resolve(request.result));
		request.addEventListener('error', () => reject(request.error));
	});
}

/**
 * Empties every object store of a database. Unlike deleting the database, this
 * is not blocked by connections of other tabs.
 */
async function clearDatabase(name: string): Promise<void> {
	const request = indexedDB.open(name);
	// Don't create a database that does not exist yet.
	request.addEventListener('upgradeneeded', () => request.transaction?.abort());
	let database: IDBDatabase;
	try {
		database = await requestToPromise(request);
	} catch {
		return;
	}
	try {
		const storeNames = [...database.objectStoreNames];
		if (storeNames.length === 0) return;
		const transaction = database.transaction(storeNames, 'readwrite');
		for (const storeName of storeNames) {
			transaction.objectStore(storeName).clear();
		}
		await new Promise<void>((resolve, reject) => {
			transaction.addEventListener('complete', () => resolve());
			transaction.addEventListener('error', () => reject(transaction.error));
			transaction.addEventListener('abort', () => reject(transaction.error));
		});
	} finally {
		database.close();
	}
}

async function deleteRoomSyncStateDatabases(): Promise<void> {
	// Best effort: the new local store ID already stops their use.
	if (typeof indexedDB.databases !== 'function') return;
	const databases = await indexedDB.databases();
	for (const { name } of databases) {
		if (name && isRoomSyncStateDbName(name)) {
			indexedDB.deleteDatabase(name);
		}
	}
}

/**
 * Removes the local data if a reset was requested. Must run before the local
 * store is loaded.
 */
export async function applyPendingLocalDataReset(): Promise<boolean> {
	if (!getItem(STORAGE_KEYS.LOCAL_DATA_RESET_PENDING)) {
		return false;
	}
	rotateLocalStoreId();
	await clearDatabase(TINYBASE_LOCAL_DB_NAME);
	try {
		await deleteRoomSyncStateDatabases();
	} catch (error) {
		logger.warn('Failed to delete old room sync state:', error);
	}
	removeItem(STORAGE_KEYS.LOCAL_DATA_RESET_PENDING);
	return true;
}
