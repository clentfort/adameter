'use client';

import type { DiaperChange } from '@/types/diaper';
import { differenceInDays } from 'date-fns';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface PottyStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
}

function calculatePottyMetrics(diaperChanges: DiaperChange[]) {
	if (diaperChanges.length === 0) {
		return {
			hitsPerDay: '0',
			pottyStool: 0,
			pottyUrine: 0,
			totalPottyHits: 0,
		};
	}

	const pottyUrine = diaperChanges.filter((c) => c.pottyUrine).length;
	const pottyStool = diaperChanges.filter((c) => c.pottyStool).length;
	const totalPottyHits = diaperChanges.filter(
		(c) => c.pottyUrine || c.pottyStool,
	).length;

	const oldestChange = new Date(
		Math.min(...diaperChanges.map((c) => new Date(c.timestamp).getTime())),
	);
	const newestChange = new Date(
		Math.max(...diaperChanges.map((c) => new Date(c.timestamp).getTime())),
	);
	const daysDiff = Math.max(
		1,
		differenceInDays(newestChange, oldestChange) + 1,
	);
	const hitsPerDay = (totalPottyHits / daysDiff).toFixed(1);

	return {
		hitsPerDay,
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

	const { hitsPerDay, pottyStool, pottyUrine, totalPottyHits } = metrics;

	return (
		<StatsCard
			accentColor="#1d4ed8"
			title={
				<fbt desc="Title for the potty statistics card">Potty Statistics</fbt>
			}
		>
			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="border rounded-md p-3 bg-white dark:bg-card">
						<p className="text-sm text-muted-foreground">
							<fbt desc="Label for the total number of potty hits">Total</fbt>
						</p>
						<div className="flex items-baseline">
							<p className="text-2xl font-bold">{totalPottyHits}</p>
							{prevMetrics && (
								<ComparisonValue
									current={totalPottyHits}
									previous={prevMetrics.totalPottyHits}
								/>
							)}
						</div>
					</div>
					<div className="border rounded-md p-3 bg-white dark:bg-card">
						<p className="text-sm text-muted-foreground">
							<fbt desc="Label for the average number of potty hits per day">
								Per Day
							</fbt>
						</p>
						<div className="flex items-baseline">
							<p className="text-2xl font-bold">{hitsPerDay}</p>
							{prevMetrics && (
								<ComparisonValue
									current={Number.parseFloat(hitsPerDay)}
									previous={Number.parseFloat(prevMetrics.hitsPerDay)}
								/>
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="border rounded-md p-3 bg-white dark:bg-card">
						<p className="text-sm text-muted-foreground">
							<fbt desc="Label for potty hits with urine">Urine</fbt>
						</p>
						<div className="flex items-baseline">
							<p className="text-xl font-bold">
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
					<div className="border rounded-md p-3 bg-white dark:bg-card">
						<p className="text-sm text-muted-foreground">
							<fbt desc="Label for potty hits with stool">Stool</fbt>
						</p>
						<div className="flex items-baseline">
							<p className="text-xl font-bold">
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
			</div>
		</StatsCard>
	);
}
