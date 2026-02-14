import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { ROW_JSON_CELL, TABLE_IDS } from './constants';
import { mergeStoreContent } from './merge';

describe('mergeStoreContent', () => {
	it('should merge missing rows and update deviceId', () => {
		const store = createStore();
		const tableId = TABLE_IDS.FEEDING_SESSIONS;
		const deviceId = 'new-device-id';

		// Store has one item
		store.setRow(tableId, '1', {
			[ROW_JSON_CELL]: JSON.stringify({ deviceId: 'old', id: '1', note: 'keep' }),
		});

		// Snapshot has another item
		const snapshotStore = createStore();
		snapshotStore.setRow(tableId, '1', {
			[ROW_JSON_CELL]: JSON.stringify({
				deviceId: 'other',
				id: '1',
				note: 'ignore',
			}),
		});
		snapshotStore.setRow(tableId, '2', {
			[ROW_JSON_CELL]: JSON.stringify({
				deviceId: 'other',
				id: '2',
				note: 'merge',
			}),
		});

		const snapshot = snapshotStore.getContent();
		mergeStoreContent(store, snapshot, deviceId);

		// Item 1 should remain unchanged
		const row1 = JSON.parse(store.getRow(tableId, '1')[ROW_JSON_CELL] as string);
		expect(row1.note).toBe('keep');
		expect(row1.deviceId).toBe('old');

		// Item 2 should be added with new deviceId
		const row2 = JSON.parse(store.getRow(tableId, '2')[ROW_JSON_CELL] as string);
		expect(row2.note).toBe('merge');
		expect(row2.deviceId).toBe(deviceId);
	});
});
