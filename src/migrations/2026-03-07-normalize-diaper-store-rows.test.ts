import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { normalizeDiaperStoreRowsMigration } from './2026-03-07-normalize-diaper-store-rows';

describe('normalizeDiaperStoreRowsMigration', () => {
	it('deletes invalid diaper product rows (missing name)', () => {
		const store = createStore();
		// Set an invalid product (missing required name)
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p-invalid', {
			isReusable: false,
		});

		const result = normalizeDiaperStoreRowsMigration.migrate(store);

		expect(result).toBe(true);
		expect(store.hasRow(TABLE_IDS.DIAPER_PRODUCTS, 'p-invalid')).toBe(false);
	});

	it('deletes invalid diaper change rows (missing timestamp)', () => {
		const store = createStore();
		// Set an invalid change (missing required timestamp)
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'c-invalid', {
			containsStool: false,
			containsUrine: true,
		});

		const result = normalizeDiaperStoreRowsMigration.migrate(store);

		expect(result).toBe(true);
		expect(store.hasRow(TABLE_IDS.DIAPER_CHANGES, 'c-invalid')).toBe(false);
	});

	it('skips rows that are already normalized', () => {
		const store = createStore();
		const validProduct = {
			color: '#3b82f6',
			isReusable: false,
			name: 'Valid Product',
		};
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p-valid', validProduct);

		const result = normalizeDiaperStoreRowsMigration.migrate(store);

		expect(result).toBe(false);
		expect(store.getRow(TABLE_IDS.DIAPER_PRODUCTS, 'p-valid')).toEqual(
			validProduct,
		);
	});
});
