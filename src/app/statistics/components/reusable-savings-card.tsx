'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import {
	addDays,
	differenceInDays,
	format,
	isWithinInterval,
	subDays,
} from 'date-fns';
import { Info } from 'lucide-react';
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
import { Currency, useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';

interface ReusableSavingsCardProps {
	allDiaperChanges: DiaperChange[];
	className?: string;
	products: DiaperProduct[];
}

interface SavingsEvent {
	contribution: number;
	timestamp: Date;
}

interface ReusableSavingsMetrics {
	breakEvenDate: Date | null;
	estimatedBreakEvenDate: Date | null;
	pottySavings: number;
	reusableSavings: number;
	totalCost: number;
	totalSavings: number;
	upfrontCostTotal: number;
}

function formatCurrency(value: number, currency: Currency) {
	return new Intl.NumberFormat(undefined, {
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
		.filter((disposableChange) =>
			isWithinInterval(disposableChange.timestamp, {
				end: addDays(timestamp, 7),
				start: subDays(timestamp, 7),
			}),
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
			if (!productId) {
				return null;
			}

			const product = productById.get(productId);
			if (!product || product.isReusable) {
				return null;
			}

			if (
				typeof product.costPerDiaper !== 'number' ||
				!Number.isFinite(product.costPerDiaper)
			) {
				return null;
			}

			const timestamp = new Date(change.timestamp);
			if (Number.isNaN(timestamp.getTime())) {
				return null;
			}

			return {
				cost: product.costPerDiaper,
				timestamp,
			};
		})
		.filter(
			(
				item,
			): item is {
				cost: number;
				timestamp: Date;
			} => item !== null,
		);

	const reusableChanges = allDiaperChanges
		.map((change) => {
			const productId = change.diaperProductId;
			if (!productId) {
				return null;
			}

			const product = productById.get(productId);
			if (!product || !product.isReusable) {
				return null;
			}

			const timestamp = new Date(change.timestamp);
			if (Number.isNaN(timestamp.getTime())) {
				return null;
			}

			return {
				reusableCost:
					typeof product.costPerDiaper === 'number' &&
					Number.isFinite(product.costPerDiaper)
						? product.costPerDiaper
						: 0,
				timestamp,
			};
		})
		.filter(
			(
				item,
			): item is {
				reusableCost: number;
				timestamp: Date;
			} => item !== null,
		);

	const pottyEvents = allDiaperChanges
		.map((change) => {
			const savedByPotty =
				(change.pottyUrine && !change.containsUrine) ||
				(change.pottyStool && !change.containsStool);
			if (!savedByPotty) {
				return null;
			}

			const timestamp = new Date(change.timestamp);
			if (Number.isNaN(timestamp.getTime())) {
				return null;
			}

			return { timestamp };
		})
		.filter((item): item is { timestamp: Date } => item !== null);

	let reusableSavingsWithoutUpfront = 0;
	const savingsEvents: SavingsEvent[] = [];

	for (const reusableChange of reusableChanges) {
		const averageDisposable = getDisposableAverageAround(
			reusableChange.timestamp,
			disposableChanges,
		);
		if (averageDisposable === null) {
			continue;
		}

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
		if (averageDisposable === null) {
			continue;
		}

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
		if (!productId) {
			return sum;
		}

		const product = productById.get(productId);
		if (
			!product ||
			typeof product.costPerDiaper !== 'number' ||
			!Number.isFinite(product.costPerDiaper)
		) {
			return sum;
		}

		return sum + product.costPerDiaper;
	}, 0);

	return {
		breakEvenDate,
		estimatedBreakEvenDate,
		pottySavings,
		reusableSavings,
		totalCost: usageCost + upfrontCostTotal,
		totalSavings,
		upfrontCostTotal,
	};
}

export default function ReusableSavingsCard({
	allDiaperChanges,
	className,
	products,
}: ReusableSavingsCardProps) {
	const [currency] = useCurrency();

	const metrics = calculateReusableSavingsMetrics(
		allDiaperChanges,
		createProductById(products),
	);

	if (!metrics) {
		return null;
	}

	const hasExactBreakEven = Boolean(metrics.breakEvenDate);
	const hasEstimatedBreakEven =
		!metrics.breakEvenDate && Boolean(metrics.estimatedBreakEvenDate);
	const breakEvenLabel = metrics.breakEvenDate
		? format(metrics.breakEvenDate, 'PPP')
		: metrics.estimatedBreakEvenDate
			? format(metrics.estimatedBreakEvenDate, 'PPP')
			: null;

	return (
		<Card className={cn('w-full', className)}>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for reusable savings card">Diaper Savings</fbt>
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
									<span className="sr-only">
										<fbt desc="Accessible label for diaper savings info button">
											Diaper savings info
										</fbt>
									</span>
								</button>
							}
						/>
						<PopoverContent className="w-80">
							<PopoverHeader>
								<PopoverTitle>
									<fbt desc="Title for diaper savings explanation popover">
										How this is calculated
									</fbt>
								</PopoverTitle>
							</PopoverHeader>
							<PopoverDescription className="text-xs leading-normal">
								<fbt desc="Explanation for diaper savings calculation">
									Savings use the average disposable cost in ±7 days around each
									reusable or potty event.
								</fbt>
							</PopoverDescription>
						</PopoverContent>
					</Popover>
				</CardAction>
			</CardHeader>

			<CardContent className="space-y-4 p-4 pt-0">
				<div className="rounded-xl border p-4">
					<p className="text-muted-foreground text-sm">
						<fbt desc="Label for total diaper savings">Total Savings</fbt>
					</p>
					<p
						className={cn(
							'mt-1 text-4xl font-bold leading-none tabular-nums',
							metrics.totalSavings >= 0
								? 'text-green-700 dark:text-green-400'
								: 'text-red-600 dark:text-red-400',
						)}
					>
						{formatCurrency(metrics.totalSavings, currency)}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="rounded-xl border border-blue-300/30 bg-blue-500/10 p-3">
						<p className="text-[11px] font-semibold tracking-[0.1em] text-blue-700 dark:text-blue-300">
							<fbt desc="Label for potty savings in diaper savings card">
								POTTY
							</fbt>
						</p>
						<p className="text-2xl font-semibold tabular-nums text-blue-950 dark:text-blue-100">
							{formatCurrency(metrics.pottySavings, currency)}
						</p>
					</div>
					<div className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-3">
						<p className="text-[11px] font-semibold tracking-[0.1em] text-rose-700 dark:text-rose-300">
							<fbt desc="Label for reusable savings in diaper savings card">
								REUSABLE
							</fbt>
						</p>
						<p className="text-2xl font-semibold tabular-nums text-rose-950 dark:text-rose-100">
							{formatCurrency(metrics.reusableSavings, currency)}
						</p>
					</div>
				</div>

				<div className="space-y-2 border-t pt-3">
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium">
							<fbt desc="Label for break-even point in diaper savings card">
								Break-even Point
							</fbt>
						</span>
						<span
							className={cn(
								'tabular-nums text-muted-foreground',
								!breakEvenLabel && 'italic',
								hasEstimatedBreakEven && 'italic',
								hasExactBreakEven && 'font-medium',
							)}
						>
							{breakEvenLabel ? (
								hasEstimatedBreakEven ? (
									<fbt desc="Estimated break-even date in diaper savings card">
										Est. <fbt:param name="date">{breakEvenLabel}</fbt:param>
									</fbt>
								) : (
									breakEvenLabel
								)
							) : (
								<fbt desc="Break-even not yet reached label">
									Not yet reached
								</fbt>
							)}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium">
							<fbt desc="Label for total diaper cost in diaper savings card">
								Total Cost
							</fbt>
						</span>
						<span className="tabular-nums text-muted-foreground">
							{formatCurrency(metrics.totalCost, currency)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
