import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
	createIndexedDbCellSyncStateStore,
	createMemoryCellSyncStateStore,
	deleteCellSyncStateDatabase,
} from './cell-sync-state';

describe.each([
	[
		'IndexedDB',
		() => createIndexedDbCellSyncStateStore(`sync-${Math.random()}`),
	],
	['memory', createMemoryCellSyncStateStore],
])('%s cell sync state', (_label, createStore) => {
	it('starts empty', async () => {
		const store = createStore();

		expect(await store.load()).toEqual({
			lastSeq: 0,
			legacySnapshotEtag: undefined,
			stamps: new Map(),
		});
	});

	it('merges saved updates', async () => {
		const store = createStore();

		await store.save({ lastSeq: 3, stamps: [['a', 'hlc-1']] });
		await store.save({
			legacySnapshotEtag: '"7"',
			stamps: [
				['a', 'hlc-2'],
				['b', 'hlc-3'],
			],
		});

		expect(await store.load()).toEqual({
			lastSeq: 3,
			legacySnapshotEtag: '"7"',
			stamps: new Map([
				['a', 'hlc-2'],
				['b', 'hlc-3'],
			]),
		});
	});

	it('clears all state', async () => {
		const store = createStore();
		await store.save({
			lastSeq: 3,
			legacySnapshotEtag: '"7"',
			stamps: [['a', 'hlc-1']],
		});

		await store.clear();

		expect((await store.load()).stamps.size).toBe(0);
		expect((await store.load()).lastSeq).toBe(0);
	});
});

describe('IndexedDB cell sync state', () => {
	it('survives reopening and is removed with its database', async () => {
		const name = `sync-${Math.random()}`;
		const first = createIndexedDbCellSyncStateStore(name);
		await first.save({ lastSeq: 5, stamps: [['a', 'hlc-1']] });
		first.close();

		const reopened = createIndexedDbCellSyncStateStore(name);
		expect((await reopened.load()).lastSeq).toBe(5);
		reopened.close();

		await deleteCellSyncStateDatabase(name);
		expect((await createIndexedDbCellSyncStateStore(name).load()).lastSeq).toBe(
			0,
		);
	});
});
