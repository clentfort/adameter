'use client';

import { format } from 'date-fns';
import { fbt } from 'fbtee';
import { Info } from 'lucide-react';
import { useMemo } from 'react';
import LineChart from '@/components/charts/line-chart';
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
import { useCurrency } from '@/hooks/use-currency';
import { useDiaperAverageCost } from '@/hooks/use-diaper-average-cost';
import { useDiaperBrands } from '@/hooks/use-diaper-brands';
import { DiaperChange } from '@/types/diaper';
import { calculateDiaperSavings } from '@/utils/diaper-savings';

interface DiaperSavingsStatsProps {
	diaperChanges: DiaperChange[];
}

export default function DiaperSavingsStats({
	diaperChanges,
}: DiaperSavingsStatsProps) {
	const { value: brands } = useDiaperBrands();
	const [averageCost] = useDiaperAverageCost();
	const [, , currencySymbol] = useCurrency();

	const savingsData = useMemo(
		() => calculateDiaperSavings(diaperChanges, brands, averageCost),
		[diaperChanges, brands, averageCost],
	);

	const {
		breakEvenPoint,
		cumulativeSavings,
		pottyTrainingSavings,
		reusableSavings,
		topBrandsSavings,
		totalSavings,
		totalUpfrontCost,
	} = savingsData;

	const chartData = useMemo(
		() => cumulativeSavings.map((d) => ({ x: d.date, y: d.savings })),
		[cumulativeSavings],
	);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						<fbt desc="Title for diaper savings card">Diaper Savings</fbt>
					</CardTitle>
					<CardAction>
						<Popover>
							<PopoverTrigger
								nativeButton={false}
								render={
									<button className="text-muted-foreground hover:text-foreground transition-colors">
										<Info className="size-4" />
										<span className="sr-only">
											<fbt desc="Help info">Info</fbt>
										</span>
									</button>
								}
							/>
							<PopoverContent className="w-80">
								<PopoverHeader>
									<PopoverTitle>
										<fbt desc="Title for diaper savings info popover">
											How is this calculated?
										</fbt>
									</PopoverTitle>
								</PopoverHeader>
								<PopoverDescription className="text-xs space-y-2">
									<p>
										<strong>
											<fbt desc="Label for potty training savings explanation">
												Potty Training:
											</fbt>
										</strong>{' '}
										<fbt desc="Explanation for potty training savings">
											Saves the cost of a diaper for every change where the
											diaper was clean and a potty success was logged.
										</fbt>
									</p>
									<p>
										<strong>
											<fbt desc="Label for reusable savings explanation">
												Reusable Usage:
											</fbt>
										</strong>{' '}
										<fbt desc="Explanation for reusable savings">
											Saves the average cost of a disposable diaper minus any
											usage costs (like liners or washing) for every reusable
											diaper change.
										</fbt>
									</p>
									<p>
										<strong>
											<fbt desc="Label for upfront costs explanation">
												Upfront Costs:
											</fbt>
										</strong>{' '}
										<fbt desc="Explanation for upfront costs">
											The initial investment for reusable diaper sets, which
											starts your savings balance in a deficit.
										</fbt>
									</p>
									<p>
										<strong>
											<fbt desc="Label for total savings explanation">
												Total Savings:
											</fbt>
										</strong>{' '}
										<fbt desc="Explanation for total savings">
											Combined savings minus the upfront costs.
										</fbt>
									</p>
								</PopoverDescription>
							</PopoverContent>
						</Popover>
					</CardAction>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="mb-6">
						<div className="border rounded-md p-4 bg-accent/10">
							<p className="text-sm text-muted-foreground mb-1">
								<fbt desc="Total savings label">Total Savings</fbt>
							</p>
							<p
								className={`text-3xl font-bold ${totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}
							>
								{currencySymbol}
								{Math.abs(totalSavings).toFixed(2)}
								{totalSavings < 0 && (
									<span className="text-sm font-normal ml-2 opacity-80">
										<fbt desc="Label for deficit status">(deficit)</fbt>
									</span>
								)}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-3 gap-3 mb-6">
						<div className="border rounded-md p-3 bg-red-50 dark:bg-red-900/20">
							<p className="text-[10px] uppercase tracking-wider font-semibold text-red-800 dark:text-red-300">
								<fbt desc="Upfront cost label">Upfront</fbt>
							</p>
							<p className="text-lg font-bold text-red-900 dark:text-red-100">
								{totalUpfrontCost > 0 ? '-' : ''}
								{currencySymbol}
								{totalUpfrontCost.toFixed(2)}
							</p>
						</div>
						<div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-900/20">
							<p className="text-[10px] uppercase tracking-wider font-semibold text-blue-800 dark:text-blue-300">
								<fbt desc="Potty training savings label">Potty</fbt>
							</p>
							<p className="text-lg font-bold text-blue-900 dark:text-blue-100">
								+{currencySymbol}
								{pottyTrainingSavings.toFixed(2)}
							</p>
						</div>
						<div className="border rounded-md p-3 bg-green-50 dark:bg-green-900/20">
							<p className="text-[10px] uppercase tracking-wider font-semibold text-green-800 dark:text-green-300">
								<fbt desc="Reusable diaper savings label">Reusable</fbt>
							</p>
							<p className="text-lg font-bold text-green-900 dark:text-green-100">
								+{currencySymbol}
								{reusableSavings.toFixed(2)}
							</p>
						</div>
					</div>

					<div className="mb-6 space-y-3">
						{totalUpfrontCost > 0 && (
							<div className="flex items-center justify-between">
								<h4 className="text-sm font-semibold">
									<fbt desc="Label for break even point">Break-even Point</fbt>
								</h4>
								<span
									className={`text-sm font-medium ${breakEvenPoint ? 'text-green-600' : 'text-muted-foreground italic'}`}
								>
									{breakEvenPoint ? (
										<fbt desc="Format for break even date reached">
											Reached on{' '}
											<fbt:param name="date">
												{format(breakEvenPoint, 'MMM d, yyyy')}
											</fbt:param>
										</fbt>
									) : (
										<fbt desc="Label for when break even is not yet reached">
											Not yet reached
										</fbt>
									)}
								</span>
							</div>
						)}

						{topBrandsSavings.length > 0 && (
							<div className="space-y-2">
								<h4 className="text-sm font-semibold">
									<fbt desc="Title for top brand savings tally">
										Top Brand Savings (Net)
									</fbt>
								</h4>
								<div className="grid gap-2">
									{topBrandsSavings.map((brand) => (
										<div
											className="flex items-center justify-between text-sm p-2 border rounded-md"
											key={brand.brandId}
										>
											<span>
												{brand.brandName} ({brand.usageCount})
											</span>
											<span
												className={`font-mono font-medium ${brand.totalSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
											>
												{brand.totalSavings >= 0 ? '+' : ''}
												{currencySymbol}
												{brand.totalSavings.toFixed(2)}
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<h4 className="text-sm font-semibold">
							<fbt desc="Title for savings over time chart">
								Savings Over Time
							</fbt>
						</h4>
						<LineChart
							backgroundColor="rgba(34, 197, 94, 0.1)"
							borderColor="#22c55e"
							data={chartData}
							datasetLabel={fbt(
								'Cumulative Savings',
								'Legend label for cumulative savings',
							)}
							emptyStateMessage={fbt(
								'Not enough data to show savings chart',
								'Empty state message for savings chart',
							)}
							showZeroLine={true}
							title={fbt('Savings Graph', 'Chart title')}
							xAxisLabel={fbt('Date', 'X-axis label')}
							xAxisType="time"
							yAxisLabel={fbt('Savings', 'Y-axis label')}
							yAxisUnit={currencySymbol}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
