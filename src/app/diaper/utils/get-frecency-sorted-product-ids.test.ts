import { subDays, subHours } from 'date-fns';
import { Row } from 'tinybase';
import { describe, expect, it } from 'vitest';
import { DiaperChange } from '@/types/diaper';
import { getFrecencySortedProductIds } from './get-frecency-sorted-product-ids';

describe('getFrecencySortedProductIds', () => {
	it('sorts by frequency, then recency, then alphabetically, handling non-string names', () => {
		const now = new Date();
		const productsById: Record<string, Row> = {
			'1': { name: 'Brand A' },
			'2': { name: 'Brand B' },
			'3': { name: 'Brand C' },
			'4': { name: 'Brand D' },
			'5': { name: 'Brand E' },
			'6': { name: 123 }, // Testing non-string name fallback (product B not string)
			'7': { name: 456 }, // Testing non-string name fallback (product A not string)
		};

		const changes: DiaperChange[] = [
			// Product '2' used twice in lookback
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
			// Product '1' used once in lookback, very recently
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '1',
				id: 'c3',
				timestamp: subHours(now, 3).toISOString(),
			},
			// Product '3' used once in lookback, less recently than '1'
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '3',
				id: 'c4',
				timestamp: subHours(now, 5).toISOString(),
			},
			// Product '4' used only outside lookback (count 0, but has lastUsed)
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: '4',
				id: 'c5',
				timestamp: subDays(now, 8).toISOString(),
			},
			// Product '5', '6', and '7' never used (count 0, lastUsed 0)
			// Change with no productId (should be ignored)
			{
				containsStool: false,
				containsUrine: true,
				id: 'c6',
				timestamp: now.toISOString(),
			},
		];

		const sortedIds = getFrecencySortedProductIds(productsById, changes);

		// '6' has name 123, '7' has name 456. Both are non-strings, which fall back to ''.
		// '5' has name 'Brand E'.
		// Since '6' and '7' both fallback to '', their order relative to each other in sort
		// is stable or determined by their initial entry order. Both come before '5'.
		expect(sortedIds).toEqual(['2', '1', '3', '4', '6', '7', '5']);
	});

	it('covers all branch pathways for name string checks', () => {
		// Purely sorting by name (no changes)
		// We want to force every pairwise comparison of (string, string), (string, non-string), (non-string, string), (non-string, non-string)
		const productsById: Record<string, Row> = {
			'1': { name: 123 },      // non-string
			'2': { name: 'Brand Z' }, // string
			'3': { name: 'Brand A' }, // string
			'4': { name: undefined }, // non-string (missing)
		};

		const sortedIds = getFrecencySortedProductIds(productsById, []);
		// '1' (falls back to '') and '4' (falls back to '') should sort before '3' and '2'.
		// The exact output order is ['1', '4', '3', '2']
		expect(sortedIds).toEqual(['1', '4', '3', '2']);
	});
});
