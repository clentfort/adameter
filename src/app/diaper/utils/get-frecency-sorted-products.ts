import { DiaperChange, DiaperProduct } from '@/types/diaper';
import { subDays } from 'date-fns';

/**
 * Sorts diaper products based on frecency (frequency and recency).
 *
 * Primary sort: Usage count in the last 7 days (descending).
 * Secondary sort: Last usage timestamp (descending).
 * Tertiary sort: Name (ascending).
 *
 * @param products The list of diaper products to sort.
 * @param changes The history of diaper changes.
 * @param lookbackDays The number of days to look back for frequency (default 7).
 * @returns A new sorted array of diaper products.
 */
export function getFrecencySortedProducts(
	products: DiaperProduct[],
	changes: DiaperChange[],
	lookbackDays = 7,
): DiaperProduct[] {
	const now = new Date().getTime();
	const lookbackThreshold = subDays(now, lookbackDays).getTime();

	const usageStats = new Map<string, { count: number; lastUsed: number }>();

	for (const change of changes) {
		if (!change.diaperProductId) continue;
		const timestamp = new Date(change.timestamp).getTime();

		const stats = usageStats.get(change.diaperProductId) || {
			count: 0,
			lastUsed: 0,
		};

		if (timestamp >= lookbackThreshold) {
			stats.count += 1;
		}

		if (timestamp > stats.lastUsed) {
			stats.lastUsed = timestamp;
		}

		usageStats.set(change.diaperProductId, stats);
	}

	return [...products].sort((a, b) => {
		const statsA = usageStats.get(a.id) || { count: 0, lastUsed: 0 };
		const statsB = usageStats.get(b.id) || { count: 0, lastUsed: 0 };

		if (statsB.count !== statsA.count) {
			return statsB.count - statsA.count;
		}

		if (statsB.lastUsed !== statsA.lastUsed) {
			return statsB.lastUsed - statsA.lastUsed;
		}

		return a.name.localeCompare(b.name);
	});
}
