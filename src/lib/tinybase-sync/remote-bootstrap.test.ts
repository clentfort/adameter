import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { ROW_JSON_CELL, ROW_ORDER_CELL, TABLE_IDS } from './constants';
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
});

function setEventRow(store: ReturnType<typeof createStore>, id: string) {
	store.setRow(TABLE_IDS.EVENTS, id, {
		[ROW_JSON_CELL]: JSON.stringify({
			id,
			startDate: '2026-02-08T00:00:00.000Z',
			title: id,
			type: 'point',
		}),
		[ROW_ORDER_CELL]: 0,
	});
}
