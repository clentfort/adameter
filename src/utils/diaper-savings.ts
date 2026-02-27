import type { DiaperChange } from '@/types/diaper';
import type { DiaperBrand } from '@/types/diaper-brand';
import { startOfDay } from 'date-fns';

export interface BrandSavings {
	brandId: string;
	brandName: string;
	totalSavings: number;
	usageCount: number;
}

export interface SavingsData {
	breakEvenPoint?: Date;
	cumulativeSavings: { date: Date; savings: number }[];
	pottyTrainingSavings: number;
	reusableSavings: number;
	topBrandsSavings: BrandSavings[];
	totalSavings: number;
	totalUpfrontCost: number;
}

export function calculateDiaperSavings(
	diaperChanges: DiaperChange[],
	brands: DiaperBrand[],
	averageDisposableCost: number,
	dateRange?: { from: Date; to: Date },
): SavingsData {
	const brandMap = new Map<string, DiaperBrand>();
	brands.forEach((b) => brandMap.set(b.id, b));

	let pottyTrainingSavings = 0;
	let reusableSavings = 0;

	const dailySavings = new Map<number, number>();
	const brandUsageCount = new Map<string, number>();

	const sortedChanges = [...diaperChanges].sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
	);

	sortedChanges.forEach((change) => {
		const changeDate = new Date(change.timestamp);
		const isInRange =
			!dateRange || (changeDate >= dateRange.from && changeDate <= dateRange.to);

		const brandId = change.diaperBrand || '';
		if (isInRange) {
			brandUsageCount.set(brandId, (brandUsageCount.get(brandId) || 0) + 1);
		}

		const brand = brandMap.get(brandId);
		let changeSavings = 0;

		if (brand?.isReusable) {
			// Using a reusable diaper saves the cost of an average disposable minus per-use costs
			const saving =
				averageDisposableCost - (brand.perUseCost ?? brand.costPerDiaper ?? 0);
			if (isInRange) {
				reusableSavings += saving;
			}
			changeSavings += saving;
		} else {
			// If it's a disposable diaper and it was clean because of potty success
			const isClean = !change.containsUrine && !change.containsStool;
			const isPottySuccess = change.pottyUrine || change.pottyStool;

			if (isClean && isPottySuccess) {
				const cost = brand?.costPerDiaper ?? averageDisposableCost;
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

	const topBrandsSavings: BrandSavings[] = Array.from(brandUsageCount.entries())
		.map(([brandId, usageCount]) => {
			const brand = brandMap.get(brandId);
			let totalSavingsForBrand = 0;

			// Calculate savings for this brand within the range
			sortedChanges.forEach((change) => {
				const changeDate = new Date(change.timestamp);
				if (
					dateRange &&
					(changeDate < dateRange.from || changeDate > dateRange.to)
				) {
					return;
				}

				if (change.diaperBrand !== brandId) return;

				if (brand?.isReusable) {
					totalSavingsForBrand +=
						averageDisposableCost -
						(brand.perUseCost ?? brand.costPerDiaper ?? 0);
				} else {
					const isClean = !change.containsUrine && !change.containsStool;
					const isPottySuccess = change.pottyUrine || change.pottyStool;
					if (isClean && isPottySuccess) {
						totalSavingsForBrand += brand?.costPerDiaper ?? averageDisposableCost;
					}
				}
			});

			// If we are looking at all time (no range), subtract upfront cost for reusables
			if (!dateRange && brand?.isReusable) {
				totalSavingsForBrand -= brand.upfrontCost;
			}

			return {
				brandId,
				brandName: brand?.name || brandId || 'Unknown',
				totalSavings: totalSavingsForBrand,
				usageCount,
			};
		})
		.sort((a, b) => b.usageCount - a.usageCount)
		.slice(0, 3);

	return {
		breakEvenPoint,
		cumulativeSavings,
		pottyTrainingSavings,
		reusableSavings,
		topBrandsSavings,
		totalSavings: pottyTrainingSavings + reusableSavings - totalUpfrontCost,
		totalUpfrontCost,
	};
}
