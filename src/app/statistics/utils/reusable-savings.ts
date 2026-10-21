import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import type { DisposableChange } from './diaper-savings';
import { addDays, differenceInDays } from 'date-fns';
import {
	getDisposableAverageAround,
	getDisposableChanges,
	isSavedByPotty,
} from './diaper-savings';

export interface ReusableSavingsMetrics {
	breakEvenDate: Date | null;
	estimatedBreakEvenDate: Date | null;
	hypotheticalDisposableCost: number;
	pottySavings: number;
	reusableSavings: number;
	totalCost: number;
	totalSavings: number;
	upfrontCostTotal: number;
	usageCost: number;
}

export interface ReusableChange {
	reusableCost: number;
	timestamp: Date;
}

export interface SavingsEvent {
	contribution: number;
	timestamp: Date;
}

export function getUpfrontCostTotal(reusableProducts: DiaperProduct[]): number {
	return reusableProducts.reduce((sum, product) => {
		if (
			typeof product.upfrontCost !== 'number' ||
			!Number.isFinite(product.upfrontCost)
		) {
			return sum;
		}

		return sum + product.upfrontCost;
	}, 0);
}

export function getReusableChanges(
	allDiaperChanges: DiaperChange[],
	productById: Map<string, DiaperProduct>,
): ReusableChange[] {
	return allDiaperChanges
		.map((change) => {
			const productId = change.diaperProductId;
			if (!productId) return null;

			const product = productById.get(productId);
			if (!product || !product.isReusable) return null;

			return {
				reusableCost:
					typeof product.costPerDiaper === 'number' &&
					Number.isFinite(product.costPerDiaper)
						? product.costPerDiaper
						: 0,
				timestamp: new Date(change.timestamp),
			};
		})
		.filter((item): item is ReusableChange => item !== null);
}

export function findBreakEvenDate(
	sortedSavingsEvents: SavingsEvent[],
	upfrontCostTotal: number,
): Date | null {
	if (sortedSavingsEvents.length === 0) {
		return null;
	}

	let runningSavings = -upfrontCostTotal;
	for (const event of sortedSavingsEvents) {
		runningSavings += event.contribution;
		if (runningSavings >= 0) {
			return event.timestamp;
		}
	}

	return null;
}

export function estimateBreakEvenDate(
	sortedSavingsEvents: SavingsEvent[],
	totalSavings: number,
): Date | null {
	if (totalSavings >= 0 || sortedSavingsEvents.length === 0) {
		return null;
	}

	const firstEventDate = sortedSavingsEvents[0].timestamp;
	const latestEventDate = sortedSavingsEvents.at(-1)!.timestamp;
	const elapsedDays = Math.max(
		1,
		differenceInDays(latestEventDate, firstEventDate) + 1,
	);
	const positiveContributionTotal = sortedSavingsEvents.reduce(
		(sum, event) => sum + event.contribution,
		0,
	);
	const contributionPerDay = positiveContributionTotal / elapsedDays;

	if (contributionPerDay > 0) {
		return addDays(
			latestEventDate,
			Math.ceil(Math.abs(totalSavings) / contributionPerDay),
		);
	}

	return null;
}

export function getHypotheticalDisposableCost(
	allDiaperChanges: DiaperChange[],
	productById: Map<string, DiaperProduct>,
	disposableChanges: DisposableChange[],
): number {
	let hypotheticalDisposableCost = 0;
	for (const change of allDiaperChanges) {
		const productId = change.diaperProductId;
		const product = productId ? productById.get(productId) : null;

		const timestamp = new Date(change.timestamp);
		const averageDisposable = getDisposableAverageAround(
			timestamp,
			disposableChanges,
		);

		if (averageDisposable !== null) {
			hypotheticalDisposableCost += averageDisposable;
		} else if (product && !product.isReusable && product.costPerDiaper) {
			hypotheticalDisposableCost += product.costPerDiaper;
		}
	}

	return hypotheticalDisposableCost;
}

export function calculateReusableSavingsMetrics(
	allDiaperChanges: DiaperChange[],
	productById: Map<string, DiaperProduct>,
): ReusableSavingsMetrics | null {
	const reusableProducts = [...productById.values()].filter(
		(product) => product.isReusable,
	);
	if (reusableProducts.length === 0) {
		return null;
	}

	const upfrontCostTotal = getUpfrontCostTotal(reusableProducts);
	const disposableChanges = getDisposableChanges(allDiaperChanges, productById);
	const reusableChanges = getReusableChanges(allDiaperChanges, productById);

	const pottyEvents = allDiaperChanges
		.filter(isSavedByPotty)
		.map((change) => ({ timestamp: new Date(change.timestamp) }));

	let reusableSavingsWithoutUpfront = 0;
	const savingsEvents: SavingsEvent[] = [];

	for (const reusableChange of reusableChanges) {
		const averageDisposable = getDisposableAverageAround(
			reusableChange.timestamp,
			disposableChanges,
		);
		if (averageDisposable === null) continue;

		const contribution = averageDisposable - reusableChange.reusableCost;
		reusableSavingsWithoutUpfront += contribution;
		savingsEvents.push({ contribution, timestamp: reusableChange.timestamp });
	}

	let pottySavings = 0;
	for (const pottyEvent of pottyEvents) {
		const averageDisposable = getDisposableAverageAround(
			pottyEvent.timestamp,
			disposableChanges,
		);
		if (averageDisposable === null) continue;

		pottySavings += averageDisposable;
		savingsEvents.push({
			contribution: averageDisposable,
			timestamp: pottyEvent.timestamp,
		});
	}

	const reusableSavings = reusableSavingsWithoutUpfront - upfrontCostTotal;
	const totalSavings = reusableSavings + pottySavings;

	const sortedSavingsEvents = [...savingsEvents].sort(
		(a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
	);

	const breakEvenDate = findBreakEvenDate(
		sortedSavingsEvents,
		upfrontCostTotal,
	);

	const estimatedBreakEvenDate = breakEvenDate
		? null
		: estimateBreakEvenDate(sortedSavingsEvents, totalSavings);

	const usageCost = reusableChanges.reduce(
		(sum, change) => sum + change.reusableCost,
		0,
	);

	const hypotheticalDisposableCost = getHypotheticalDisposableCost(
		allDiaperChanges,
		productById,
		disposableChanges,
	);

	return {
		breakEvenDate,
		estimatedBreakEvenDate,
		hypotheticalDisposableCost,
		pottySavings,
		reusableSavings,
		totalCost: usageCost + upfrontCostTotal,
		totalSavings,
		upfrontCostTotal,
		usageCost,
	};
}
