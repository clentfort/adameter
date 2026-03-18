'use client';

import type { DiaperChange } from '@/types/diaper';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface PottySuccessStatsProps {
	className?: string;
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
	className,
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
			className={className}
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
			<div className="mt-2 space-y-1 text-xs text-muted-foreground">
				<div className="flex flex-wrap items-baseline gap-x-2">
					<span className="text-yellow-700 dark:text-yellow-500 font-medium">
						<fbt desc="Label for potty urine count in stats card">
							Urine caught
						</fbt>
					</span>
					<span className="font-medium text-foreground">
						{metrics.urineCount}
					</span>
					{prevMetrics && (
						<ComparisonValue
							current={metrics.urineCount}
							previous={prevMetrics.urineCount}
						/>
					)}
				</div>
				<div className="flex flex-wrap items-baseline gap-x-2 border-t border-border/50 pt-1">
					<span className="text-amber-800 dark:text-amber-500 font-medium">
						<fbt desc="Label for potty stool count in stats card">
							Poo caught
						</fbt>
					</span>
					<span className="font-medium text-foreground">
						{metrics.stoolCount}
					</span>
					{prevMetrics && (
						<ComparisonValue
							current={metrics.stoolCount}
							previous={prevMetrics.stoolCount}
						/>
					)}
				</div>
				<div className="flex flex-wrap items-baseline gap-x-2 border-t border-border/50 pt-1">
					<span>
						<fbt desc="Label for average potty success per day in stats card">
							Avg per day
						</fbt>
					</span>
					<span className="font-medium text-foreground">
						{metrics.avgPerDay.toFixed(1)}
					</span>
					{prevMetrics && (
						<ComparisonValue
							current={metrics.avgPerDay}
							previous={prevMetrics.avgPerDay}
						/>
					)}
				</div>
			</div>
		</StatsCard>
	);
}
