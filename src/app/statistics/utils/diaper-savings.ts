import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { differenceInDays } from 'date-fns';

export interface DisposableChange {
	cost: number;
	timestamp: Date;
}

export function isSavedByPotty(
	change: Pick<
		DiaperChange,
		'containsStool' | 'containsUrine' | 'pottyStool' | 'pottyUrine'
	>,
): boolean {
	return (
		Boolean(change.pottyUrine && !change.containsUrine) ||
		Boolean(change.pottyStool && !change.containsStool)
	);
}

export function getDisposableCostPerDiaper(
	product: DiaperProduct | null | undefined,
): number | null {
	if (!product || product.isReusable) return null;
	const cost = product.costPerDiaper;
	if (typeof cost !== 'number' || !Number.isFinite(cost) || cost <= 0)
		return null;
	return cost;
}

export function getDisposableChanges(
	changes: DiaperChange[],
	productById: Map<string, DiaperProduct>,
): DisposableChange[] {
	return changes
		.map((change) => {
			const productId = change.diaperProductId;
			if (!productId) return null;

			const cost = getDisposableCostPerDiaper(productById.get(productId));
			if (cost === null) return null;

			return {
				cost,
				timestamp: new Date(change.timestamp),
			};
		})
		.filter((item): item is DisposableChange => item !== null);
}

export function getDisposableAverageAround(
	timestamp: Date,
	disposableChanges: DisposableChange[],
): number | null {
	const costs = disposableChanges
		.filter(
			(disposableChange) =>
				Math.abs(differenceInDays(disposableChange.timestamp, timestamp)) <= 7,
		)
		.map((disposableChange) => disposableChange.cost);

	if (costs.length === 0) {
		return null;
	}

	return costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
}
