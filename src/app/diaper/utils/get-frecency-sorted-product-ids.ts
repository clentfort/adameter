import type { Row } from 'tinybase';
import type { DiaperChange } from '@/types/diaper';
import { subDays } from 'date-fns';

export function getFrecencySortedProductIds(
	productsById: Record<string, Row>,
	changes: DiaperChange[],
	lookbackDays = 7,
): string[] {
	const now = Date.now();
	const lookbackThreshold = subDays(now, lookbackDays).getTime();
	const usageStats = new Map<string, { count: number; lastUsed: number }>();

	for (const change of changes) {
		if (!change.diaperProductId) {
			continue;
		}

		const timestamp = new Date(change.timestamp).getTime();
		const stats = usageStats.get(change.diaperProductId) ?? {
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

	return Object.entries(productsById)
		.sort(([productIdA, productA], [productIdB, productB]) => {
			const statsA = usageStats.get(productIdA) ?? { count: 0, lastUsed: 0 };
			const statsB = usageStats.get(productIdB) ?? { count: 0, lastUsed: 0 };

			if (statsB.count !== statsA.count) {
				return statsB.count - statsA.count;
			}

			if (statsB.lastUsed !== statsA.lastUsed) {
				return statsB.lastUsed - statsA.lastUsed;
			}

			const nameA = typeof productA.name === 'string' ? productA.name : '';
			const nameB = typeof productB.name === 'string' ? productB.name : '';

			return nameA.localeCompare(nameB);
		})
		.map(([productId]) => productId);
}
