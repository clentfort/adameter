import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { ROW_ORDER_CELL, TABLE_IDS } from './constants';
import {
	reconcileRemoteLoadResult,
	snapshotStoreContentIfNonEmpty,
} from './remote-bootstrap';

describe('remote-bootstrap', () => {
	it('restores local snapshot when remote load is empty', () => {
		const store = createStore();
		setEventRow(store, 'local');

		const localSnapshot = snapshotStoreContentIfNonEmpty(store);
		store.delTables();

		const result = reconcileRemoteLoadResult(store, localSnapshot);

		expect(result).toEqual({
			decision: 'restore-local',
			localHadData: true,
			remoteHadData: false,
		});
		expect(store.getRowCount(TABLE_IDS.EVENTS)).toBe(1);
		expect(store.hasRow(TABLE_IDS.EVENTS, 'local')).toBe(true);
	});

	it('keeps remote data when remote load is non-empty', () => {
		const store = createStore();
		setEventRow(store, 'local');
		const localSnapshot = snapshotStoreContentIfNonEmpty(store);

		store.delTables();
		setEventRow(store, 'remote');

		const result = reconcileRemoteLoadResult(store, localSnapshot);

		expect(result).toEqual({
			decision: 'keep-remote',
			localHadData: true,
			remoteHadData: true,
		});
		expect(store.getRowCount(TABLE_IDS.EVENTS)).toBe(1);
		expect(store.hasRow(TABLE_IDS.EVENTS, 'remote')).toBe(true);
		expect(store.hasRow(TABLE_IDS.EVENTS, 'local')).toBe(false);
	});

	it('stays empty when both local and remote are empty', () => {
		const store = createStore();

		const result = reconcileRemoteLoadResult(store, undefined);

		expect(result).toEqual({
			decision: 'keep-empty',
			localHadData: false,
			remoteHadData: false,
		});
		expect(store.getRowCount(TABLE_IDS.EVENTS)).toBe(0);
	});

	it('keeps remote data when clear strategy is selected', () => {
		const store = createStore();
		setEventRow(store, 'local');
		const localSnapshot = snapshotStoreContentIfNonEmpty(store);

		store.delTables();
		setEventRow(store, 'remote');

		const result = reconcileRemoteLoadResult(store, localSnapshot, 'clear');

		expect(result).toEqual({
			decision: 'keep-remote',
			localHadData: true,
			remoteHadData: true,
		});
		expect(store.getRowCount(TABLE_IDS.EVENTS)).toBe(1);
		expect(store.hasRow(TABLE_IDS.EVENTS, 'remote')).toBe(true);
		expect(store.hasRow(TABLE_IDS.EVENTS, 'local')).toBe(false);
	});

	it('exercises additional bootstrap edge cases (merge, empty store, and fallback)', () => {
		const store = createStore();

		// 1. Empty store snapshot (line 22)
		expect(snapshotStoreContentIfNonEmpty(store)).toBeUndefined();

		// 2. Merge strategy (lines 51-52)
		setEventRow(store, 'local');
		const localSnapshot = snapshotStoreContentIfNonEmpty(store);
		store.delTables();
		setEventRow(store, 'remote');
		const mergeResult = reconcileRemoteLoadResult(
			store,
			localSnapshot,
			'merge',
			'device-1',
		);
		expect(mergeResult.decision).toBe('merge');
		expect(store.getRowCount(TABLE_IDS.EVENTS)).toBe(2);

		// 3. Fallback when structuredClone is missing (line 30)
		const originalStructuredClone = globalThis.structuredClone;
		// @ts-expect-error - testing fallback
		delete globalThis.structuredClone;
		try {
			expect(snapshotStoreContentIfNonEmpty(store)).toEqual(store.getContent());
		} finally {
			globalThis.structuredClone = originalStructuredClone;
		}
	});
});

function setEventRow(store: ReturnType<typeof createStore>, id: string) {
	store.setRow(TABLE_IDS.EVENTS, id, {
		[ROW_ORDER_CELL]: 0,
		startDate: '2026-02-08T00:00:00.000Z',
		title: id,
		type: 'point',
	});
}
