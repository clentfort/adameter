import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { fixDiaperProductCostsMigration } from './2026-03-07-fix-diaper-product-costs';

describe('fixDiaperProductCostsMigration', () => {
	it('converts string costs to numbers', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', {
			costPerDiaper: '0.50',
			isReusable: false,
			name: 'Product 1',
			upfrontCost: '10.00',
		});

		fixDiaperProductCostsMigration.migrate(store);

		const row = store.getRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1');
		expect(row.costPerDiaper).toBe(0.5);
		expect(row.upfrontCost).toBe(10);
	});

	it('does not affect already correct numeric costs', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', {
			costPerDiaper: 0.75,
			isReusable: false,
			name: 'Product 1',
		});

		fixDiaperProductCostsMigration.migrate(store);

		const row = store.getRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1');
		expect(row.costPerDiaper).toBe(0.75);
	});

	it('handles missing costs gracefully', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', {
			isReusable: false,
			name: 'Product 1',
		});

		fixDiaperProductCostsMigration.migrate(store);

		const row = store.getRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1');
		expect(row.costPerDiaper).toBeUndefined();
		expect(row.upfrontCost).toBeUndefined();
	});
});
