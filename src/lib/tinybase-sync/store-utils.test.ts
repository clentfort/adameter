import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_PROFILE,
	TABLE_IDS,
} from './constants';
import { isStoreDataEmpty } from './store-utils';

describe('isStoreDataEmpty', () => {
	it('should return true when store is empty', () => {
		const store = createStore();
		expect(isStoreDataEmpty(store)).toBe(true);
	});

	it('should return false when store has table rows', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.EVENTS, '1', { id: '1', notes: 'test' });
		expect(isStoreDataEmpty(store)).toBe(false);
	});

	it('should return false when store has feeding in progress value', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, '2025-01-01T00:00:00.000Z');
		expect(isStoreDataEmpty(store)).toBe(false);
	});

	it('should return false when store has profile value', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_PROFILE, 'some-profile-data');
		expect(isStoreDataEmpty(store)).toBe(false);
	});
});
