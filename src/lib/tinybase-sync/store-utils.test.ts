import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	STORE_VALUE_FEEDING_IN_PROGRESS,
	STORE_VALUE_PROFILE,
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from './constants';
import {
	isStoreDataEmpty,
	snapshotStoreContentIfNonEmpty,
} from './store-utils';

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

	it('should return false when store has selected profile ID value', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'some-profile-id');
		expect(isStoreDataEmpty(store)).toBe(false);
	});
});

describe('snapshotStoreContentIfNonEmpty', () => {
	it('should return undefined when store is empty', () => {
		const store = createStore();
		expect(snapshotStoreContentIfNonEmpty(store)).toBeUndefined();
	});

	it('should return structured clone of store content when store is not empty and structuredClone is available', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_PROFILE, 'some-profile-data');
		const result = snapshotStoreContentIfNonEmpty(store);
		expect(result).toEqual(store.getContent());
		expect(result).not.toBe(store.getContent()); // It should be a clone, not the exact reference
	});

	it('should return store content when store is not empty and structuredClone is not available', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_PROFILE, 'some-profile-data');

		// Temporarily delete structuredClone
		const originalStructuredClone = globalThis.structuredClone;
		// @ts-expect-error - overriding structuredClone to test fallback path
		delete globalThis.structuredClone;

		try {
			const result = snapshotStoreContentIfNonEmpty(store);
			expect(result).toEqual(store.getContent());
		} finally {
			// Restore structuredClone
			globalThis.structuredClone = originalStructuredClone;
		}
	});
});
