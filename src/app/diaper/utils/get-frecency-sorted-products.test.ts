import { DiaperChange, DiaperProduct } from '@/types/diaper';
import { subDays, subHours } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { getFrecencySortedProducts } from './get-frecency-sorted-products';

describe('getFrecencySortedProducts', () => {
	const products: DiaperProduct[] = [
		{ id: '1', isReusable: false, name: 'Brand A' },
		{ id: '2', isReusable: false, name: 'Brand B' },
		{ id: '3', isReusable: false, name: 'Brand C' },
	];

	it('sorts by usage count in the last 7 days', () => {
		const now = new Date();
		const changes: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '2',
				id: 'c1',
				timestamp: subHours(now, 1).toISOString(),
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '2',
				id: 'c2',
				timestamp: subHours(now, 2).toISOString(),
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '1',
				id: 'c3',
				timestamp: subHours(now, 3).toISOString(),
			},
		];

		const sorted = getFrecencySortedProducts(products, changes);
		expect(sorted[0].id).toBe('2'); // Used twice
		expect(sorted[1].id).toBe('1'); // Used once
		expect(sorted[2].id).toBe('3'); // Never used
	});

	it('sorts by recency when counts are equal', () => {
		const now = new Date();
		const changes: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '1',
				id: 'c1',
				timestamp: subHours(now, 5).toISOString(),
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '2',
				id: 'c2',
				timestamp: subHours(now, 1).toISOString(),
			},
		];

		const sorted = getFrecencySortedProducts(products, changes);
		expect(sorted[0].id).toBe('2'); // More recent
		expect(sorted[1].id).toBe('1');
		expect(sorted[2].id).toBe('3');
	});

	it('uses alphabetical sort as final fallback', () => {
		const sorted = getFrecencySortedProducts(products, []);
		expect(sorted[0].name).toBe('Brand A');
		expect(sorted[1].name).toBe('Brand B');
		expect(sorted[2].name).toBe('Brand C');
	});

	it('only counts usage within the lookback window', () => {
		const now = new Date();
		const changes: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '1',
				id: 'c1',
				timestamp: subDays(now, 8).toISOString(), // Outside 7 days
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '2',
				id: 'c2',
				timestamp: subDays(now, 1).toISOString(), // Inside 7 days
			},
		];

		const sorted = getFrecencySortedProducts(products, changes);
		expect(sorted[0].id).toBe('2');
		expect(sorted[1].id).toBe('1');
	});
});
