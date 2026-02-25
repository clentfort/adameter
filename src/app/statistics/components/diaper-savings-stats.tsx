'use client';

import { fbt } from 'fbtee';
import { useMemo } from 'react';
import LineChart from '@/components/charts/line-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

	const savingsData = useMemo(
		() => calculateDiaperSavings(diaperChanges, brands, averageCost),
		[diaperChanges, brands, averageCost],
	);

	const {
		breakEvenPoint,
		cumulativeSavings,
		pottyTrainingSavings,
		reusableSavings,
		totalSavings,
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
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<div className="grid grid-cols-2 gap-4 mb-6">
						<div className="border rounded-md p-3">
							<p className="text-sm text-muted-foreground">
								<fbt desc="Total savings label">Total Savings</fbt>
							</p>
							<p
								className={`text-2xl font-bold ${totalSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}
							>
								{totalSavings.toFixed(2)}
							</p>
						</div>
						<div className="border rounded-md p-3">
							<p className="text-sm text-muted-foreground">
								<fbt desc="Break-even point label">Break-even</fbt>
							</p>
							<p className="text-lg font-semibold">
								{breakEvenPoint ? (
									breakEvenPoint.toLocaleDateString()
								) : (
									<fbt desc="Label when break even not reached">
										Not reached
									</fbt>
								)}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 mb-6">
						<div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-900/20">
							<p className="text-sm text-blue-800 dark:text-blue-300">
								<fbt desc="Potty training savings label">Potty Training</fbt>
							</p>
							<p className="text-xl font-bold text-blue-900 dark:text-blue-100">
								+{pottyTrainingSavings.toFixed(2)}
							</p>
						</div>
						<div className="border rounded-md p-3 bg-green-50 dark:bg-green-900/20">
							<p className="text-sm text-green-800 dark:text-green-300">
								<fbt desc="Reusable diaper savings label">Reusable Usage</fbt>
							</p>
							<p className="text-xl font-bold text-green-900 dark:text-green-100">
								+{reusableSavings.toFixed(2)}
							</p>
						</div>
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
							title={fbt('Savings Graph', 'Chart title')}
							xAxisLabel={fbt('Date', 'X-axis label')}
							yAxisLabel={fbt('Savings', 'Y-axis label')}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
