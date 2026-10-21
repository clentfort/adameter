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

export function getDisposableChanges(
	changes: DiaperChange[],
	productById: Map<string, DiaperProduct>,
): DisposableChange[] {
	return changes
		.map((change) => {
			const productId = change.diaperProductId;
			if (!productId) return null;

			const product = productById.get(productId);
			if (!product || product.isReusable) return null;

			if (
				typeof product.costPerDiaper !== 'number' ||
				!Number.isFinite(product.costPerDiaper) ||
				product.costPerDiaper <= 0
			) {
				return null;
			}

			return {
				cost: product.costPerDiaper,
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
