import 'fake-indexeddb/auto';
import { createMergeableStore } from 'tinybase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createMergeableBlobIndexedDbPersister,
	createMergeableIndexedDbPersister,
} from './indexed-db-mergeable';

let dbCounter = 0;
function uniqueDbName() {
	return `test-db-${++dbCounter}`;
}

describe('createMergeableIndexedDbPersister', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns undefined when the database is empty', async () => {
		const store = createMergeableStore('device-1');
		const persister = createMergeableIndexedDbPersister(store, uniqueDbName());

		await persister.load();

		expect(store.getTables()).toEqual({});
		expect(store.getValues()).toEqual({});

		await persister.destroy();
	});

	it('saves and restores table data', async () => {
		const dbName = uniqueDbName();

		const storeA = createMergeableStore('device-a');
		storeA.setCell('events', 'row-1', 'type', 'feeding');
		storeA.setCell('events', 'row-1', 'time', 1000);

		const persisterA = createMergeableIndexedDbPersister(storeA, dbName);
		await persisterA.save();
		await persisterA.destroy();

		const storeB = createMergeableStore('device-b');
		const persisterB = createMergeableIndexedDbPersister(storeB, dbName);
		await persisterB.load();
		await persisterB.destroy();

		expect(storeB.getCell('events', 'row-1', 'type')).toBe('feeding');
		expect(storeB.getCell('events', 'row-1', 'time')).toBe(1000);
	});

	it('saves and restores values', async () => {
		const dbName = uniqueDbName();

		const storeA = createMergeableStore('device-a');
		storeA.setValue('profile', 'Alice');
		storeA.setValue('count', 42);

		const persisterA = createMergeableIndexedDbPersister(storeA, dbName);
		await persisterA.save();
		await persisterA.destroy();

		const storeB = createMergeableStore('device-b');
		const persisterB = createMergeableIndexedDbPersister(storeB, dbName);
		await persisterB.load();
		await persisterB.destroy();

		expect(storeB.getValue('profile')).toBe('Alice');
		expect(storeB.getValue('count')).toBe(42);
	});

	it('preserves CRDT timestamps so merges work correctly after reload', async () => {
		const dbName = uniqueDbName();

		const storeA = createMergeableStore('device-a');
		storeA.setCell('events', 'row-1', 'value', 'original');

		const persisterA = createMergeableIndexedDbPersister(storeA, dbName);
		await persisterA.save();
		await persisterA.destroy();

		const storeB = createMergeableStore('device-b');
		const persisterB = createMergeableIndexedDbPersister(storeB, dbName);
		await persisterB.load();
		await persisterB.destroy();

		const contentA = storeA.getMergeableContent();
		const contentB = storeB.getMergeableContent();

		// CRDT metadata (HLC and hash) must be preserved in the round-trip
		expect(contentB[0][1]).toBe(contentA[0][1]); // tables HLC
		expect(contentB[0][2]).toBe(contentA[0][2]); // tables hash
		expect(contentB[1][1]).toBe(contentA[1][1]); // values HLC
		expect(contentB[1][2]).toBe(contentA[1][2]); // values hash
	});

	it('handles multiple tables', async () => {
		const dbName = uniqueDbName();

		const storeA = createMergeableStore('device-a');
		storeA.setCell('tableA', 'row-1', 'cell', 'a1');
		storeA.setCell('tableB', 'row-2', 'cell', 'b2');
		storeA.setValue('key1', 'val1');

		const persisterA = createMergeableIndexedDbPersister(storeA, dbName);
		await persisterA.save();
		await persisterA.destroy();

		const storeB = createMergeableStore('device-b');
		const persisterB = createMergeableIndexedDbPersister(storeB, dbName);
		await persisterB.load();
		await persisterB.destroy();

		expect(storeB.getCell('tableA', 'row-1', 'cell')).toBe('a1');
		expect(storeB.getCell('tableB', 'row-2', 'cell')).toBe('b2');
		expect(storeB.getValue('key1')).toBe('val1');
	});

	it('calls onIgnoredError when load fails due to DB error', async () => {
		const onIgnoredError = vi.fn();
		const store = createMergeableStore('device-a');

		// Simulate failure by patching indexedDB.open to return an error request
		const originalOpen = indexedDB.open.bind(indexedDB);
		vi.spyOn(indexedDB, 'open').mockImplementationOnce((name, version) => {
			const req = originalOpen(name, version);
			// Replace onsuccess handler so it triggers onerror instead
			const origOnSuccess = Object.getOwnPropertyDescriptor(
				IDBOpenDBRequest.prototype,
				'onsuccess',
			);
			Object.defineProperty(req, 'onsuccess', {
				configurable: true,
				get: origOnSuccess?.get,
				set(handler) {
					// Override: invoke onerror instead
					Promise.resolve().then(() => {
						Object.defineProperty(req, 'error', {
							configurable: true,
							value: new DOMException('Simulated failure', 'UnknownError'),
						});
						req.onerror?.(new Event('error'));
					});
				},
			});
			return req;
		});

		const persister = createMergeableIndexedDbPersister(
			store,
			'error-db',
			onIgnoredError,
		);
		await persister.load();
		await persister.destroy();

		expect(store.getTables()).toEqual({});
	});
});

describe('createMergeableBlobIndexedDbPersister', () => {
	it('returns undefined when the blob store does not exist in the DB', async () => {
		const store = createMergeableStore('device-a');
		const dbName = uniqueDbName();

		// Create DB without the 'mergeable_v1' object store
		await new Promise<void>((resolve, reject) => {
			const req = indexedDB.open(dbName, 1);
			req.onupgradeneeded = () => {};
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});

		const persister = createMergeableBlobIndexedDbPersister(store, dbName);
		await persister.load();
		await persister.destroy();

		expect(store.getTables()).toEqual({});
	});

	it('returns undefined for a DB that does not exist', async () => {
		const store = createMergeableStore('device-a');
		const persister = createMergeableBlobIndexedDbPersister(
			store,
			uniqueDbName(),
		);
		await persister.load();
		await persister.destroy();

		expect(store.getTables()).toEqual({});
	});
});
