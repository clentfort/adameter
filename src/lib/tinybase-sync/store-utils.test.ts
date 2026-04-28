import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_PROFILE,
	TABLE_IDS,
} from './constants';
import { isStoreDataEmpty } from './store-utils';

describe('isStoreDataEmpty', () => {
	it('returns true for an empty store', () => {
		const store = createStore();
		expect(isStoreDataEmpty(store)).toBe(true);
	});

	it('returns false if any table has rows', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, '1', {
			timestamp: '2021-01-01T00:00:00Z',
		});
		expect(isStoreDataEmpty(store)).toBe(false);
	});

	it('returns false if feeding in progress value is set', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, 'session-id');
		expect(isStoreDataEmpty(store)).toBe(false);
	});

	it('returns false if profile value is set', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_PROFILE, { name: 'Baby' });
		expect(isStoreDataEmpty(store)).toBe(false);
	});
});
