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
		for (const tableId of Object.values(TABLE_IDS)) {
			const store = createStore();
			store.setRow(tableId, 'row1', { cell1: 'value1' });
			expect(isStoreDataEmpty(store)).toBe(false);
		}
	});

	it('returns false if feedingInProgress is a string', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, 'session-id');
		expect(isStoreDataEmpty(store)).toBe(false);
	});

	it('returns true if feedingInProgress is not a string (e.g., undefined or boolean)', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, true as unknown as string);
		expect(isStoreDataEmpty(store)).toBe(true);
	});

	it('returns false if profile exists', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_PROFILE, { name: 'Baby' });
		expect(isStoreDataEmpty(store)).toBe(false);
	});
});
