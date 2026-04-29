import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_FEEDING_IN_PROGRESS } from './constants';
import { isStoreDataEmpty } from './store-utils';

describe('isStoreDataEmpty', () => {
	it('returns false when feeding is in progress', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, '2026-03-27T10:00:00Z');
		expect(isStoreDataEmpty(store)).toBe(false);
	});
});
