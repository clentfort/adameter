import type { DiaperChange } from '@/types/diaper';
import type { DiaperBrand } from '@/types/diaper-brand';
import { differenceInDays, startOfDay } from 'date-fns';

export interface BrandSpending {
	brandId: string;
	brandName: string;
	totalSpend: number;
	usageCount: number;
}

export interface SavingsData {
	breakEvenPoint?: Date;
	cumulativeSavings: { date: Date; savings: number }[];
	estimatedBreakEvenDate?: Date;
	pottyTrainingSavings: number;
	reusableSavings: number;
	topBrandsSpending: BrandSpending[];
	totalSavings: number;
	totalUpfrontCost: number;
}

export function calculateDiaperSavings(
	diaperChanges: DiaperChange[],
	brands: DiaperBrand[],
	fallbackAverageCost: number,
	dateRange?: { from: Date; to: Date },
): SavingsData {
	const brandMap = new Map<string, DiaperBrand>();
	brands.forEach((b) => brandMap.set(b.id, b));

	let pottyTrainingSavings = 0;
	let reusableSavings = 0;

	const dailySavings = new Map<number, number>();
	const brandUsageCount = new Map<string, number>();
	const brandSpend = new Map<string, number>();

	const sortedChanges = [...diaperChanges].sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);

	const disposableChanges = sortedChanges.filter(
		(c) => !brandMap.get(c.diaperBrand || '')?.isReusable,
	);

	sortedChanges.forEach((change, index) => {
		const changeDate = new Date(change.timestamp);
		const isInRange =
			!dateRange ||
			(changeDate >= dateRange.from && changeDate <= dateRange.to);

		const brandId = change.diaperBrand || '';
		const brand = brandMap.get(brandId);

		if (isInRange) {
			brandUsageCount.set(brandId, (brandUsageCount.get(brandId) || 0) + 1);
		}

		let changeSavings = 0;

		// Get dynamic average cost based on 5 disposables before and after
		let effectiveDisposableCost = fallbackAverageCost;
		const originalIndex = disposableChanges.indexOf(change);
		// If it's a reusable diaper, it won't be in disposableChanges, so we find where it would be
		let searchIndex = originalIndex;
		if (searchIndex === -1) {
			searchIndex = disposableChanges.findIndex(
				(c) => new Date(c.timestamp) >= new Date(change.timestamp),
			);
		}

		let relevantDisposables;
		if (searchIndex === -1) {
			relevantDisposables = disposableChanges.slice(-10);
		} else {
			const start = Math.max(0, searchIndex - 5);
			const end = searchIndex + 5 + (originalIndex !== -1 ? 1 : 0);
			relevantDisposables = disposableChanges.slice(start, end);
		}

		const costs = relevantDisposables
			.map((c) => brandMap.get(c.diaperBrand || '')?.costPerDiaper)
			.filter((cost): cost is number => cost !== undefined);

		if (costs.length > 0) {
			effectiveDisposableCost = costs.reduce((a, b) => a + b, 0) / costs.length;
		}

		if (brand?.isReusable) {
			const usageCost = brand.perUseCost ?? brand.costPerDiaper ?? 0;
			const saving = effectiveDisposableCost - usageCost;
			if (isInRange) {
				reusableSavings += saving;
				brandSpend.set(brandId, (brandSpend.get(brandId) || 0) + usageCost);
			}
			changeSavings += saving;
		} else {
			const cost = brand?.costPerDiaper ?? effectiveDisposableCost;
			if (isInRange) {
				brandSpend.set(brandId, (brandSpend.get(brandId) || 0) + cost);
			}

			// If it's a disposable diaper and it was clean because of potty success
			const isClean = !change.containsUrine && !change.containsStool;
			const isPottySuccess = change.pottyUrine || change.pottyStool;

			if (isClean && isPottySuccess) {
				if (isInRange) {
					pottyTrainingSavings += cost;
				}
				changeSavings += cost;
			}
		}

		if (changeSavings !== 0) {
			const day = startOfDay(changeDate).getTime();
			dailySavings.set(day, (dailySavings.get(day) || 0) + changeSavings);
		}
	});

	const totalUpfrontCost = brands
		.filter((b) => b.isReusable)
		.reduce((sum, b) => sum + (b.upfrontCost || 0), 0);

	const sortedDays = Array.from(dailySavings.keys()).sort();
	const cumulativeSavings: { date: Date; savings: number }[] = [];
	let currentTotal = -totalUpfrontCost;

	let breakEvenPoint: Date | undefined;

	if (totalUpfrontCost > 0 || sortedChanges.length > 0) {
		const firstChangeDate =
			sortedChanges.length > 0
				? new Date(sortedChanges[0].timestamp)
				: new Date();
		cumulativeSavings.push({
			date: startOfDay(firstChangeDate),
			savings: -totalUpfrontCost,
		});
		if (currentTotal >= 0) {
			breakEvenPoint = startOfDay(firstChangeDate);
		}
	}

	sortedDays.forEach((day) => {
		currentTotal += dailySavings.get(day) || 0;
		cumulativeSavings.push({ date: new Date(day), savings: currentTotal });

		if (!breakEvenPoint && currentTotal >= 0) {
			breakEvenPoint = new Date(day);
		}
	});

	let estimatedBreakEvenDate: Date | undefined;
	if (!breakEvenPoint && currentTotal < 0 && sortedChanges.length > 0) {
		const firstDate = new Date(sortedChanges[0].timestamp);
		const lastDate = new Date(sortedChanges.at(-1)!.timestamp);
		const daysDiff = Math.max(1, differenceInDays(lastDate, firstDate));
		const totalSavingsSoFar = currentTotal + totalUpfrontCost;
		const averageSavingsPerDay = totalSavingsSoFar / daysDiff;

		if (averageSavingsPerDay > 0) {
			const remainingDeficit = Math.abs(currentTotal);
			const daysToBreakEven = Math.ceil(
				remainingDeficit / averageSavingsPerDay,
			);
			estimatedBreakEvenDate = new Date(lastDate);
			estimatedBreakEvenDate.setDate(
				estimatedBreakEvenDate.getDate() + daysToBreakEven,
			);
		}
	}

	const topBrandsSpending: BrandSpending[] = Array.from(
		brandUsageCount.entries(),
	)
		.map(([brandId, usageCount]) => {
			const brand = brandMap.get(brandId);
			return {
				brandId,
				brandName: brand?.name || brandId || 'Unknown',
				totalSpend: brandSpend.get(brandId) || 0,
				usageCount,
			};
		})
		.sort((a, b) => b.usageCount - a.usageCount)
		.slice(0, 5);

	return {
		breakEvenPoint,
		cumulativeSavings,
		estimatedBreakEvenDate,
		pottyTrainingSavings,
		reusableSavings,
		topBrandsSpending,
		totalSavings:
			pottyTrainingSavings +
			reusableSavings -
			(dateRange ? 0 : totalUpfrontCost),
		totalUpfrontCost,
	};
}
