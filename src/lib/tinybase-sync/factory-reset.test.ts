import 'fake-indexeddb/auto';
import { createMergeableStore } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { beforeEach, describe, expect, it } from 'vitest';
import { clear, getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { getRoomSyncStateDbName, TINYBASE_LOCAL_DB_NAME } from './constants';
import {
	applyPendingLocalDataReset,
	backupAndClearLocalStore,
} from './factory-reset';

async function listDatabases() {
	return (await indexedDB.databases()).map(({ name }) => name);
}

async function saveEvent(dbName: string) {
	const store = createMergeableStore();
	store.setCell('events', 'e1', 'title', 'Doctor');
	const persister = createIndexedDbPersister(store, dbName);
	await persister.save();
	await persister.destroy();
	return store;
}

async function loadStore(dbName: string) {
	const store = createMergeableStore();
	const persister = createIndexedDbPersister(store, dbName);
	await persister.load();
	await persister.destroy();
	return store;
}

describe('local data reset', () => {
	beforeEach(async () => {
		clear();
		for (const name of await listDatabases()) {
			if (name) indexedDB.deleteDatabase(name);
		}
	});

	it('does nothing unless a reset was requested', async () => {
		await saveEvent(TINYBASE_LOCAL_DB_NAME);

		expect(await applyPendingLocalDataReset()).toBe(false);
		expect(
			(await loadStore(TINYBASE_LOCAL_DB_NAME)).hasRow('events', 'e1'),
		).toBe(true);
	});

	it('backs up the store, then clears local data and sync state on the next start', async () => {
		const store = await saveEvent(TINYBASE_LOCAL_DB_NAME);
		setItem(STORAGE_KEYS.LOCAL_STORE_ID, 'old-store');
		const syncStateDb = getRoomSyncStateDbName('old-store', 'room-hash');
		await new Promise<void>((resolve) => {
			const request = indexedDB.open(syncStateDb);
			request.addEventListener('success', () => {
				request.result.close();
				resolve();
			});
		});

		await backupAndClearLocalStore(store);
		// Nothing is deleted from the live store, so no deletions can sync.
		expect(store.hasRow('events', 'e1')).toBe(true);

		expect(await applyPendingLocalDataReset()).toBe(true);
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(
			(await loadStore(TINYBASE_LOCAL_DB_NAME)).hasRow('events', 'e1'),
		).toBe(false);
		const databases = await listDatabases();
		const backup = databases.find((name) => name?.includes('-backup-'));
		expect((await loadStore(backup!)).hasRow('events', 'e1')).toBe(true);
		expect(databases).not.toContain(syncStateDb);
		expect(getItem(STORAGE_KEYS.LOCAL_STORE_ID)).not.toBe('old-store');
		expect(getItem(STORAGE_KEYS.LOCAL_DATA_RESET_PENDING)).toBeNull();
	});

	it('does not create a missing local database', async () => {
		setItem(STORAGE_KEYS.LOCAL_DATA_RESET_PENDING, '1');

		await applyPendingLocalDataReset();

		expect(await listDatabases()).not.toContain(TINYBASE_LOCAL_DB_NAME);
	});
});
