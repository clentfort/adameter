import type { Content } from 'tinybase';
import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from './constants';
import { mergeStoreContent } from './merge';

describe('mergeStoreContent', () => {
	it('should merge missing rows and update deviceId', () => {
		const store = createStore();
		const tableId = TABLE_IDS.FEEDING_SESSIONS;
		const deviceId = 'new-device-id';

		// Store has one item
		store.setRow(tableId, '1', {
			deviceId: 'old',
			id: '1',
			note: 'keep',
		});

		// Snapshot has another item
		const snapshotStore = createStore();
		snapshotStore.setRow(tableId, '1', {
			deviceId: 'other',
			id: '1',
			note: 'ignore',
		});
		snapshotStore.setRow(tableId, '2', {
			deviceId: 'other',
			id: '2',
			note: 'merge',
		});

		const snapshot = snapshotStore.getContent();
		mergeStoreContent(store, snapshot, deviceId);

		// Item 1 should remain unchanged
		const row1 = store.getRow(tableId, '1');
		expect(row1.note).toBe('keep');
		expect(row1.deviceId).toBe('old');

		// Item 2 should be added with new deviceId
		const row2 = store.getRow(tableId, '2');
		expect(row2.note).toBe('merge');
		expect(row2.deviceId).toBe(deviceId);
	});

	it('should ignore forbidden tables and merge missing or empty values', () => {
		const store = createStore();
		store.setValue('existing', 'value');
		store.setValue('empty', '');

		const snapshot: Content = [
			{
				forbiddenTable: {
					row1: { cell1: 'value1' },
				},
			} as unknown as Record<string, Record<string, Record<string, string>>>,
			{
				empty: 'filled',
				existing: 'ignored',
				new: 'added',
			},
		];

		mergeStoreContent(store, snapshot, 'device1');

		expect(store.hasTable('forbiddenTable')).toBe(false);
		expect(store.getValue('existing')).toBe('value');
		expect(store.getValue('empty')).toBe('filled');
		expect(store.getValue('new')).toBe('added');
	});
});
