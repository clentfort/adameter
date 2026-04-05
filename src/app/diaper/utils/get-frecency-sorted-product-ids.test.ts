import type { Row } from 'tinybase';
import type { DiaperChange } from '@/types/diaper';
import { subDays, subHours } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { getFrecencySortedProductIds } from './get-frecency-sorted-product-ids';

describe('getFrecencySortedProductIds', () => {
	it('should correctly sort product IDs by frequency, recency, and name fallback', () => {
		const now = Date.now();
		const productsById: Record<string, Row> = {
			p1: { name: 'Product B' },
			p2: { name: 'Product A' },
			p3: { name: 'Product C' },
			p4: { name: 123 }, // Non-string name
			p5: { name: 'Product D' },
			p6: { name: 'Brand B' },
			p7: { name: 'Brand A' },
		};

		const changes: DiaperChange[] = [
			// p1: Used twice within lookback
			{
				diaperProductId: 'p1',
				id: 'c1',
				timestamp: new Date(now).toISOString(),
			} as DiaperChange,
			{
				diaperProductId: 'p1',
				id: 'c2',
				timestamp: subHours(now, 1).toISOString(),
			} as DiaperChange,
			// p2: Used once within lookback, lastUsed = now
			{
				diaperProductId: 'p2',
				id: 'c3',
				timestamp: new Date(now).toISOString(),
			} as DiaperChange,
			// p3: Used once within lookback, lastUsed = 1 day ago
			{
				diaperProductId: 'p3',
				id: 'c4',
				timestamp: subDays(now, 1).toISOString(),
			} as DiaperChange,
			// p4: Used once OUTSIDE lookback (8 days ago)
			{
				diaperProductId: 'p4',
				id: 'c5',
				timestamp: subDays(now, 8).toISOString(),
			} as DiaperChange,
			// c6: Missing diaperProductId (should be ignored)
			{
				diaperProductId: undefined,
				id: 'c6',
				timestamp: new Date(now).toISOString(),
			} as DiaperChange,
		];

		const result = getFrecencySortedProductIds(productsById, changes, 7);

		// Expected order:
		// 1. p1: count=2
		// 2. p2: count=1, lastUsed=now
		// 3. p3: count=1, lastUsed=now-1d
		// 4. p4: count=0, lastUsed=now-8d, name fallback to ''
		// 5. p7: count=0, lastUsed=0, name='Brand A'
		// 6. p6: count=0, lastUsed=0, name='Brand B'
		// 7. p5: count=0, lastUsed=0, name='Product D'

		expect(result).toEqual(['p1', 'p2', 'p3', 'p4', 'p7', 'p6', 'p5']);
	});
});
