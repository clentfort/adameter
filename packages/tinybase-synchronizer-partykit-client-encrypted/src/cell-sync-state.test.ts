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

		expect(await store.load()).toEqual({ epoch: undefined, stamps: new Map() });
	});

	it('merges saved updates', async () => {
		const store = createStore();

		await store.save({ stamps: [['a', 'hlc-1']] });
		await store.save({
			stamps: [
				['a', 'hlc-2'],
				['b', 'hlc-3'],
			],
		});

		expect(await store.load()).toEqual({
			epoch: undefined,
			stamps: new Map([
				['a', 'hlc-2'],
				['b', 'hlc-3'],
			]),
		});
	});

	it('drops stamps learned for another epoch', async () => {
		const store = createStore();
		await store.save({ epoch: 'epoch-1', stamps: [['a', 'hlc-1']] });
		await store.clear('epoch-2');

		await store.save({ epoch: 'epoch-1', stamps: [['b', 'hlc-2']] });
		await store.save({ epoch: 'epoch-2', stamps: [['c', 'hlc-3']] });

		expect(await store.load()).toEqual({
			epoch: 'epoch-2',
			stamps: new Map([['c', 'hlc-3']]),
		});
	});

	it('clears all state', async () => {
		const store = createStore();
		await store.save({ stamps: [['a', 'hlc-1']] });

		await store.clear();

		expect(await store.load()).toEqual({ epoch: undefined, stamps: new Map() });
	});
});

describe('IndexedDB cell sync state', () => {
	it('survives reopening and is removed with its database', async () => {
		const name = `sync-${Math.random()}`;
		const first = createIndexedDbCellSyncStateStore(name);
		await first.save({ stamps: [['a', 'hlc-1']] });
		first.close();

		const reopened = createIndexedDbCellSyncStateStore(name);
		expect((await reopened.load()).stamps.get('a')).toBe('hlc-1');
		reopened.close();

		await deleteCellSyncStateDatabase(name);
		expect(
			(await createIndexedDbCellSyncStateStore(name).load()).stamps.size,
		).toBe(0);
	});
});
