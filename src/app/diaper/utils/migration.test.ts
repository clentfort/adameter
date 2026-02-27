import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { createStore } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { ROW_JSON_CELL, TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	migrateDiaperBrandsToProducts,
	migrateDiaperChange,
} from './migration';

describe('migrateDiaperChange', () => {
	it('should not change records that already have potty data', () => {
		const record = {
			abnormalities: 'Urin abgehalten',
			containsUrine: true,
			id: '1',
			pottyStool: false,
			pottyUrine: true,
			timestamp: Date.now(),
		} as DiaperChange;
		expect(migrateDiaperChange(record)).toBe(record);
	});

	it('should migrate "Urin abgehalten"', () => {
		const record = {
			abnormalities: 'Urin abgehalten',
			containsStool: false,
			containsUrine: true,
			id: '1',
			timestamp: Date.now(),
		} as DiaperChange;
		const migrated = migrateDiaperChange(record);
		expect(migrated.pottyUrine).toBe(true);
		expect(migrated.containsUrine).toBe(true);
	});

	it('should migrate "Stuhl abgehalten"', () => {
		const record = {
			abnormalities: 'Stuhl abgehalten',
			containsStool: true,
			containsUrine: false,
			id: '1',
			timestamp: Date.now(),
		} as DiaperChange;
		const migrated = migrateDiaperChange(record);
		expect(migrated.pottyStool).toBe(true);
		expect(migrated.containsStool).toBe(true);
	});

	it('should handle "Windel trocken"', () => {
		const record = {
			abnormalities: 'Windel trocken, Urin abgehalten',
			containsStool: false,
			containsUrine: true,
			id: '1',
			timestamp: Date.now(),
		} as DiaperChange;
		const migrated = migrateDiaperChange(record);
		expect(migrated.pottyUrine).toBe(true);
		expect(migrated.containsUrine).toBe(false);
		expect(migrated.containsStool).toBe(false);
	});

	it('should handle both urine and stool', () => {
		const record = {
			abnormalities: 'Beides abgehalten',
			containsStool: true,
			containsUrine: true,
			id: '1',
			timestamp: Date.now(),
		} as DiaperChange;
		const migrated = migrateDiaperChange(record);
		expect(migrated.pottyUrine).toBe(true);
		expect(migrated.pottyStool).toBe(true);
	});
});

describe('migrateDiaperBrandsToProducts', () => {
	it('should migrate brands to products and handle duplicates', () => {
		const store = createStore();
		const change1: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			diaperBrand: 'pampers',
			id: 'c1',
			timestamp: new Date().toISOString(),
		};
		const change2: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			diaperBrand: 'pampers',
			id: 'c2',
			timestamp: new Date().toISOString(),
		};
		const change3: DiaperChange = {
			containsStool: true,
			containsUrine: false,
			diaperBrand: 'huggies',
			id: 'c3',
			timestamp: new Date().toISOString(),
		};

		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'c1', {
			[ROW_JSON_CELL]: JSON.stringify(change1),
		});
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'c2', {
			[ROW_JSON_CELL]: JSON.stringify(change2),
		});
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'c3', {
			[ROW_JSON_CELL]: JSON.stringify(change3),
		});

		const changed = migrateDiaperBrandsToProducts(store);
		expect(changed).toBe(true);

		const products = store.getTable(TABLE_IDS.DIAPER_PRODUCTS);
		const productList = Object.values(products).map((r) =>
			JSON.parse(r[ROW_JSON_CELL]),
		) as DiaperProduct[];

		expect(productList).toHaveLength(2);
		const pampers = productList.find((p) => p.name === 'Pampers');
		const huggies = productList.find((p) => p.name === 'Huggies');
		expect(pampers).toBeDefined();
		expect(huggies).toBeDefined();

		const migratedChange1 = JSON.parse(
			store.getRow(TABLE_IDS.DIAPER_CHANGES, 'c1')[ROW_JSON_CELL],
		) as DiaperChange;
		expect(migratedChange1.diaperProductId).toBe(pampers?.id);

		const migratedChange3 = JSON.parse(
			store.getRow(TABLE_IDS.DIAPER_CHANGES, 'c3')[ROW_JSON_CELL],
		) as DiaperChange;
		expect(migratedChange3.diaperProductId).toBe(huggies?.id);
	});

	it('should handle pre-existing products', () => {
		const store = createStore();
		const existingProduct: DiaperProduct = {
			id: 'p1',
			isReusable: false,
			name: 'Pampers',
		};
		store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', {
			[ROW_JSON_CELL]: JSON.stringify(existingProduct),
		});

		const change: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			diaperBrand: 'pampers',
			id: 'c1',
			timestamp: new Date().toISOString(),
		};
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'c1', {
			[ROW_JSON_CELL]: JSON.stringify(change),
		});

		migrateDiaperBrandsToProducts(store);

		const products = store.getTable(TABLE_IDS.DIAPER_PRODUCTS);
		expect(Object.keys(products)).toHaveLength(1); // No new product created

		const migratedChange = JSON.parse(
			store.getRow(TABLE_IDS.DIAPER_CHANGES, 'c1')[ROW_JSON_CELL],
		) as DiaperChange;
		expect(migratedChange.diaperProductId).toBe('p1');
	});

	it('should handle large amounts of data without errors', () => {
		const store = createStore();
		const count = 3000;
		for (let i = 0; i < count; i++) {
			const change: DiaperChange = {
				containsStool: i % 2 === 0,
				containsUrine: true,
				diaperBrand: i % 3 === 0 ? 'pampers' : 'huggies',
				id: `c${i}`,
				timestamp: new Date().toISOString(),
			};
			store.setRow(TABLE_IDS.DIAPER_CHANGES, `c${i}`, {
				[ROW_JSON_CELL]: JSON.stringify(change),
			});
		}

		const startTime = Date.now();
		migrateDiaperBrandsToProducts(store);
		const duration = Date.now() - startTime;

		expect(duration).toBeLessThan(1000); // Should be very fast with transactions

		const products = store.getTable(TABLE_IDS.DIAPER_PRODUCTS);
		expect(Object.keys(products)).toHaveLength(2);
	});
});
