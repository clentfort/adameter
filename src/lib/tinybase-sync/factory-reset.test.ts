import 'fake-indexeddb/auto';
import { createMergeableStore } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clear, getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import {
	getLocalStoreDbName,
	getRoomSyncStateDbName,
	TINYBASE_LOCAL_DB_NAME,
} from './constants';
import {
	backupAndClearLocalStore,
	deleteObsoleteLocalDatabases,
	onLocalDataReset,
} from './factory-reset';
import { getLocalDbName, getLocalStoreId } from './local-store-id';

async function listDatabases() {
	return (await indexedDB.databases()).map(({ name }) => name);
}

async function createDatabase(name: string) {
	await new Promise<void>((resolve) => {
		const request = indexedDB.open(name);
		request.addEventListener('success', () => {
			request.result.close();
			resolve();
		});
	});
}

async function saveEvent(dbName: string, title = 'Doctor') {
	const store = createMergeableStore();
	store.setCell('events', 'e1', 'title', title);
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

	it('uses the original database until the first reset', () => {
		expect(getLocalDbName()).toBe(TINYBASE_LOCAL_DB_NAME);
	});

	it('backs up the store and switches to a new, empty store', async () => {
		const store = await saveEvent(TINYBASE_LOCAL_DB_NAME);
		const oldStoreId = getLocalStoreId();

		await backupAndClearLocalStore(store);

		// Nothing is deleted from the live store, so no deletions can sync.
		expect(store.hasRow('events', 'e1')).toBe(true);
		expect(getLocalStoreId()).not.toBe(oldStoreId);
		expect(getLocalDbName()).toBe(getLocalStoreDbName(getLocalStoreId()));
		expect((await loadStore(getLocalDbName())).hasRow('events', 'e1')).toBe(
			false,
		);
		const backup = (await listDatabases()).find((name) =>
			name?.includes('-backup-'),
		);
		expect((await loadStore(backup!)).hasRow('events', 'e1')).toBe(true);
	});

	it('fails instead of resetting when the backup cannot be saved', async () => {
		const store = await saveEvent(TINYBASE_LOCAL_DB_NAME);
		const open = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
			throw new DOMException('Storage is full', 'QuotaExceededError');
		});

		try {
			await expect(backupAndClearLocalStore(store)).rejects.toThrow(
				'Failed to back up',
			);
		} finally {
			open.mockRestore();
		}
		expect(getItem(STORAGE_KEYS.LOCAL_DB_NAME)).toBeNull();
	});

	it('keeps another tab that still saves the old store out of the new one', async () => {
		const store = await saveEvent(TINYBASE_LOCAL_DB_NAME);
		const otherTab = createIndexedDbPersister(
			createMergeableStore(),
			TINYBASE_LOCAL_DB_NAME,
		);
		await otherTab.load();
		await otherTab.startAutoSave();

		await backupAndClearLocalStore(store);
		otherTab.getStore().setCell('events', 'e2', 'title', 'Old tab');
		await otherTab.save();
		await otherTab.destroy();

		const reloaded = await loadStore(getLocalDbName());
		expect(reloaded.getTableIds()).toEqual([]);
	});

	it('tells other tabs about the reset', async () => {
		const onReset = vi.fn();
		const stopListening = onLocalDataReset(onReset);

		await backupAndClearLocalStore(createMergeableStore());

		await vi.waitFor(() => expect(onReset).toHaveBeenCalled());
		stopListening();
	});

	it('deletes stores and sync state of earlier resets', async () => {
		const oldStoreId = 'old-store';
		setItem(STORAGE_KEYS.LOCAL_STORE_ID, oldStoreId);
		const oldSyncDb = getRoomSyncStateDbName(oldStoreId, 'room');
		await saveEvent(TINYBASE_LOCAL_DB_NAME);
		await createDatabase(oldSyncDb);
		await backupAndClearLocalStore(createMergeableStore());
		await saveEvent(getLocalDbName());
		const currentSyncDb = getRoomSyncStateDbName(getLocalStoreId(), 'room');
		await createDatabase(currentSyncDb);

		await deleteObsoleteLocalDatabases();

		// Deletions complete asynchronously.
		await vi.waitFor(async () => {
			const names = await listDatabases();
			expect(names).not.toContain(TINYBASE_LOCAL_DB_NAME);
			expect(names).not.toContain(oldSyncDb);
		});
		const databases = await listDatabases();
		expect(databases).toContain(getLocalDbName());
		expect(databases).toContain(currentSyncDb);
		expect(databases.some((name) => name?.includes('-backup-'))).toBe(true);
	});

	it('deletes nothing before the first reset', async () => {
		await saveEvent(TINYBASE_LOCAL_DB_NAME);
		await createDatabase(getLocalStoreDbName('unknown'));

		await deleteObsoleteLocalDatabases();
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(getItem(STORAGE_KEYS.LOCAL_DB_NAME)).toBeNull();
		expect(await listDatabases()).toEqual(
			expect.arrayContaining([
				TINYBASE_LOCAL_DB_NAME,
				getLocalStoreDbName('unknown'),
			]),
		);
	});
});
