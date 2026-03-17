'use client';

import type { DiaperChange } from '@/types/diaper';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface PottySuccessStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
}

function calculateDetailedPottyMetrics(changes: DiaperChange[]) {
	const total = changes.filter((c) => c.pottyUrine || c.pottyStool).length;
	const urineCount = changes.filter((c) => c.pottyUrine).length;
	const stoolCount = changes.filter((c) => c.pottyStool).length;

	let avgPerDay = 0;
	if (changes.length > 0) {
		const oldest = new Date(
			Math.min(...changes.map((c) => new Date(c.timestamp).getTime())),
		);
		const newest = new Date(
			Math.max(...changes.map((c) => new Date(c.timestamp).getTime())),
		);
		const days = Math.max(1, differenceInDays(newest, oldest) + 1);
		avgPerDay = total / days;
	}
	return { avgPerDay, stoolCount, total, urineCount };
}

export default function PottySuccessStats({
	comparisonDiaperChanges,
	diaperChanges = [],
}: PottySuccessStatsProps) {
	const metrics = useMemo(
		() => calculateDetailedPottyMetrics(diaperChanges),
		[diaperChanges],
	);
	const prevMetrics = useMemo(
		() =>
			comparisonDiaperChanges
				? calculateDetailedPottyMetrics(comparisonDiaperChanges)
				: null,
		[comparisonDiaperChanges],
	);

	return (
		<StatsCard
			title={
				<fbt desc="Title for potty success statistics card">Potty Success</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">{metrics.total}</div>
				{prevMetrics && (
					<ComparisonValue
						current={metrics.total}
						previous={prevMetrics.total}
					/>
				)}
			</div>
			<div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
				<div className="flex justify-between">
					<span>
						<fbt desc="Label for potty urine count">Urine</fbt>
					</span>
					<span className="font-medium">{metrics.urineCount}</span>
				</div>
				<div className="flex justify-between">
					<span>
						<fbt desc="Label for potty stool count">Stool</fbt>
					</span>
					<span className="font-medium text-amber-800 dark:text-amber-500">
						{metrics.stoolCount}
					</span>
				</div>
				<div className="flex justify-between col-span-2 border-t border-border/50 pt-1">
					<span>
						<fbt desc="Label for average potty success per day">
							Avg per day
						</fbt>
					</span>
					<span className="font-medium text-foreground">
						{metrics.avgPerDay.toFixed(1)}
					</span>
				</div>
			</div>
		</StatsCard>
	);
}
