'use client';

import type { DiaperChange } from '@/types/diaper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ComparisonValue from './comparison-value';

interface PottyStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
}

function calculatePottyMetrics(diaperChanges: DiaperChange[]) {
	const pottyUrine = diaperChanges.filter((c) => c.pottyUrine).length;
	const pottyStool = diaperChanges.filter((c) => c.pottyStool).length;
	const totalPottyHits = diaperChanges.filter(
		(c) => c.pottyUrine || c.pottyStool,
	).length;

	return {
		pottyStool,
		pottyUrine,
		totalPottyHits,
	};
}

export default function PottyStats({
	comparisonDiaperChanges,
	diaperChanges = [],
}: PottyStatsProps) {
	const metrics = calculatePottyMetrics(diaperChanges);
	const prevMetrics = comparisonDiaperChanges
		? calculatePottyMetrics(comparisonDiaperChanges)
		: null;

	const { pottyStool, pottyUrine, totalPottyHits } = metrics;

	return (
		<Card className="w-full">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for the potty statistics card">Potty Statistics</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="grid grid-cols-3 gap-4">
					<div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-800/30">
						<p className="text-sm text-blue-800 dark:text-blue-300">
							<fbt desc="Label for total potty hits">Total</fbt>
						</p>
						<div className="flex items-baseline">
							<p className="text-xl font-bold text-blue-800 dark:text-blue-300">
								{totalPottyHits}
							</p>
							{prevMetrics && (
								<ComparisonValue
									current={totalPottyHits}
									previous={prevMetrics.totalPottyHits}
								/>
							)}
						</div>
					</div>
					<div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-800/30">
						<p className="text-sm text-blue-800 dark:text-blue-300">
							<fbt desc="Label for potty hits with urine">Urine</fbt>
						</p>
						<div className="flex items-baseline">
							<p className="text-xl font-bold text-blue-800 dark:text-blue-300">
								{pottyUrine}
							</p>
							{prevMetrics && (
								<ComparisonValue
									current={pottyUrine}
									previous={prevMetrics.pottyUrine}
								/>
							)}
						</div>
					</div>
					<div className="border rounded-md p-3 bg-blue-50 dark:bg-blue-800/30">
						<p className="text-sm text-blue-800 dark:text-blue-300">
							<fbt desc="Label for potty hits with stool">Stool</fbt>
						</p>
						<div className="flex items-baseline">
							<p className="text-xl font-bold text-blue-800 dark:text-blue-300">
								{pottyStool}
							</p>
							{prevMetrics && (
								<ComparisonValue
									current={pottyStool}
									previous={prevMetrics.pottyStool}
								/>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
