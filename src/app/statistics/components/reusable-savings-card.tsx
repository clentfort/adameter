'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { addDays, differenceInDays, format } from 'date-fns';
import { Info } from 'lucide-react';
import { useMemo } from 'react';
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '@/components/ui/popover';
import { useLanguage } from '@/contexts/i18n-context';
import { Currency, useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';

interface ReusableSavingsCardProps {
	allDiaperChanges: DiaperChange[];
	className?: string;
	products: DiaperProduct[];
}
interface ReusableSavingsMetrics {
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
function formatCurrency(value: number, currency: Currency, locale: string) {
	return new Intl.NumberFormat(locale.replace('_', '-'), {
		currency,
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
		style: 'currency',
	}).format(value);
}
function createProductById(products: DiaperProduct[]) {
	return new Map(products.map((product) => [product.id, product]));
}
function getDisposableAverageAround(
	timestamp: Date,
	disposableChanges: Array<{ cost: number; timestamp: Date }>,
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
function calculateReusableSavingsMetrics(
	allDiaperChanges: DiaperChange[],
	productById: Map<string, DiaperProduct>,
): ReusableSavingsMetrics | null {
	const reusableProducts = [...productById.values()].filter(
		(product) => product.isReusable,
	);
	if (reusableProducts.length === 0) {
		return null;
	}
	const upfrontCostTotal = reusableProducts.reduce((sum, product) => {
		if (
			typeof product.upfrontCost !== 'number' ||
			!Number.isFinite(product.upfrontCost)
		) {
			return sum;
		}
		return sum + product.upfrontCost;
	}, 0);
	const disposableChanges = allDiaperChanges
		.map((change) => {
			const productId = change.diaperProductId;
			if (!productId) return null;
			const product = productById.get(productId);
			if (!product || product.isReusable) return null;
			if (
				typeof product.costPerDiaper !== 'number' ||
				!Number.isFinite(product.costPerDiaper)
			) {
				return null;
			}
			return {
				cost: product.costPerDiaper,
				timestamp: new Date(change.timestamp),
			};
		})
		.filter((item): item is { cost: number; timestamp: Date } => item !== null);
	const reusableChanges = allDiaperChanges
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
		.filter(
			(item): item is { reusableCost: number; timestamp: Date } =>
				item !== null,
		);
	const pottyEvents = allDiaperChanges
		.map((change) => {
			const savedByPotty =
				(change.pottyUrine && !change.containsUrine) ||
				(change.pottyStool && !change.containsStool);
			if (!savedByPotty) return null;
			return { timestamp: new Date(change.timestamp) };
		})
		.filter((item): item is { timestamp: Date } => item !== null);
	let reusableSavingsWithoutUpfront = 0;
	const savingsEvents: { contribution: number; timestamp: Date }[] = [];
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
	let breakEvenDate: Date | null = null;
	if (savingsEvents.length > 0) {
		const sortedSavingsEvents = [...savingsEvents].sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
		);
		let runningSavings = -upfrontCostTotal;
		for (const event of sortedSavingsEvents) {
			runningSavings += event.contribution;
			if (runningSavings >= 0) {
				breakEvenDate = event.timestamp;
				break;
			}
		}
	}
	let estimatedBreakEvenDate: Date | null = null;
	if (!breakEvenDate && totalSavings < 0 && savingsEvents.length > 0) {
		const sortedSavingsEvents = [...savingsEvents].sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
		);
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
			estimatedBreakEvenDate = addDays(
				latestEventDate,
				Math.ceil(Math.abs(totalSavings) / contributionPerDay),
			);
		}
	}
	const usageCost = allDiaperChanges.reduce((sum, change) => {
		const productId = change.diaperProductId;
		if (!productId) return sum;
		const product = productById.get(productId);
		if (
			!product ||
			!product.isReusable ||
			typeof product.costPerDiaper !== 'number' ||
			!Number.isFinite(product.costPerDiaper)
		) {
			return sum;
		}
		return sum + product.costPerDiaper;
	}, 0);
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

export default function ReusableSavingsCard({
	allDiaperChanges,
	className,
	products,
}: ReusableSavingsCardProps) {
	const [currency] = useCurrency();
	const { locale } = useLanguage();
	const productById = useMemo(() => createProductById(products), [products]);
	const metrics = useMemo(
		() => calculateReusableSavingsMetrics(allDiaperChanges, productById),
		[allDiaperChanges, productById],
	);
	if (!metrics) return null;
	const breakEvenLabel = metrics.breakEvenDate
		? format(metrics.breakEvenDate, 'PPP')
		: metrics.estimatedBreakEvenDate
			? format(metrics.estimatedBreakEvenDate, 'PPP')
			: null;
	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for reusable cost overview card">
						Reusable Diaper Metrics
					</fbt>
				</CardTitle>
				<CardAction>
					<Popover>
						<PopoverTrigger
							render={
								<button
									className="text-muted-foreground hover:text-foreground"
									type="button"
								>
									<Info className="size-4" />
								</button>
							}
						/>
						<PopoverContent className="w-80">
							<PopoverHeader>
								<PopoverTitle>
									<fbt desc="Title for reusable cost explanation">
										How this is calculated
									</fbt>
								</PopoverTitle>
							</PopoverHeader>
							<PopoverDescription className="text-xs leading-normal">
								<fbt desc="Explanation for reusable savings calculation">
									Calculates savings by comparing actual reusable diaper costs
									(upfront + usage) against the estimated cost of disposables
									for the same number of changes.
								</fbt>
							</PopoverDescription>
						</PopoverContent>
					</Popover>
				</CardAction>
			</CardHeader>
			<CardContent className="space-y-4 p-4 pt-0">
				<div className="grid grid-cols-2 gap-4">
					<div className="rounded-xl border p-4">
						<p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
							<fbt desc="Label for total reusable savings">Total Savings</fbt>
						</p>
						<p
							className={cn(
								'mt-1 text-2xl font-bold tabular-nums',
								metrics.totalSavings >= 0
									? 'text-green-700 dark:text-green-400'
									: 'text-red-600 dark:text-red-400',
							)}
						>
							{formatCurrency(metrics.totalSavings, currency, locale)}
						</p>
					</div>
					<div className="rounded-xl border p-4 flex flex-col justify-center">
						<p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
							<fbt desc="Label for break-even point">Break-even</fbt>
						</p>
						<p className="mt-1 text-sm font-medium tabular-nums text-muted-foreground">
							{breakEvenLabel ? (
								metrics.estimatedBreakEvenDate ? (
									<fbt desc="Estimated break-even date">
										Est. <fbt:param name="date">{breakEvenLabel}</fbt:param>
									</fbt>
								) : (
									breakEvenLabel
								)
							) : (
								<fbt desc="Break-even not yet reached">Not yet reached</fbt>
							)}
						</p>
					</div>
				</div>
				<div className="space-y-2 border-t pt-3">
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium text-muted-foreground">
							<fbt desc="Label for upfront cost">Upfront Cost</fbt>
						</span>
						<span className="tabular-nums text-muted-foreground">
							{formatCurrency(metrics.upfrontCostTotal, currency, locale)}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium text-muted-foreground">
							<fbt desc="Label for usage cost">Usage Cost</fbt>
						</span>
						<span className="tabular-nums text-muted-foreground">
							{formatCurrency(metrics.usageCost, currency, locale)}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm border-t pt-2 mt-2">
						<span className="font-semibold">
							<fbt desc="Label for total cost">Total Cost</fbt>
						</span>
						<span className="tabular-nums font-semibold">
							{formatCurrency(metrics.totalCost, currency, locale)}
						</span>
					</div>
					<div className="flex items-center justify-between text-xs text-muted-foreground pt-1 italic border-t mt-2">
						<span>
							<fbt desc="Label for hypothetical disposable cost">
								Hypothetical Disposable Cost
							</fbt>
						</span>
						<span className="tabular-nums">
							{formatCurrency(
								metrics.hypotheticalDisposableCost,
								currency,
								locale,
							)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
