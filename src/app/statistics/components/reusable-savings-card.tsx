'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { format } from 'date-fns';
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
import { useCurrency } from '@/hooks/use-currency';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/format-currency';
import { calculateReusableSavingsMetrics } from '../utils/reusable-savings';

interface ReusableSavingsCardProps {
	allDiaperChanges: DiaperChange[];
	className?: string;
	products: DiaperProduct[];
}

interface CostRowProps {
	className?: string;
	label: React.ReactNode;
	labelClassName?: string;
	value: string;
	valueClassName?: string;
}

function CostRow({
	className,
	label,
	labelClassName,
	value,
	valueClassName,
}: CostRowProps) {
	return (
		<div className={cn('flex items-center justify-between', className)}>
			<span className={labelClassName}>{label}</span>
			<span className={cn('tabular-nums', valueClassName)}>{value}</span>
		</div>
	);
}

function createProductById(products: DiaperProduct[]) {
	return new Map(products.map((product) => [product.id, product]));
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
					<CostRow
						className="text-sm"
						label={<fbt desc="Label for upfront cost">Upfront Cost</fbt>}
						labelClassName="font-medium text-muted-foreground"
						value={formatCurrency(metrics.upfrontCostTotal, currency, locale)}
						valueClassName="text-muted-foreground"
					/>
					<CostRow
						className="text-sm"
						label={<fbt desc="Label for usage cost">Usage Cost</fbt>}
						labelClassName="font-medium text-muted-foreground"
						value={formatCurrency(metrics.usageCost, currency, locale)}
						valueClassName="text-muted-foreground"
					/>
					<CostRow
						className="text-sm border-t pt-2 mt-2"
						label={<fbt desc="Label for total cost">Total Cost</fbt>}
						labelClassName="font-semibold"
						value={formatCurrency(metrics.totalCost, currency, locale)}
						valueClassName="font-semibold"
					/>
					<CostRow
						className="text-xs text-muted-foreground pt-1 italic border-t mt-2"
						label={
							<fbt desc="Label for hypothetical disposable cost">
								Hypothetical Disposable Cost
							</fbt>
						}
						value={formatCurrency(
							metrics.hypotheticalDisposableCost,
							currency,
							locale,
						)}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
