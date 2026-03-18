'use client';

import type { DiaperChange } from '@/types/diaper';
import { differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface AvgDiaperChangesStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
}

function calculateDetailedAvgPerDay(changes: DiaperChange[]) {
	if (changes.length === 0) return { avg: 0, stool: 0, urine: 0 };
	const oldest = new Date(
		Math.min(...changes.map((c) => new Date(c.timestamp).getTime())),
	);
	const newest = new Date(
		Math.max(...changes.map((c) => new Date(c.timestamp).getTime())),
	);
	const days = Math.max(1, differenceInDays(newest, oldest) + 1);

	return {
		avg: changes.length / days,
		stool: changes.filter((c) => c.containsStool).length / days,
		urine: changes.filter((c) => c.containsUrine).length / days,
	};
}

export default function AvgDiaperChangesStats({
	comparisonDiaperChanges,
	diaperChanges = [],
}: AvgDiaperChangesStatsProps) {
	const stats = useMemo(
		() => calculateDetailedAvgPerDay(diaperChanges),
		[diaperChanges],
	);
	const prevStats = useMemo(
		() =>
			comparisonDiaperChanges
				? calculateDetailedAvgPerDay(comparisonDiaperChanges)
				: null,
		[comparisonDiaperChanges],
	);

	return (
		<StatsCard
			title={
				<fbt desc="Title for average diaper changes per day stat">
					Avg Changes / Day
				</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">{stats.avg.toFixed(1)}</div>
				{prevStats !== null && (
					<ComparisonValue current={stats.avg} previous={prevStats.avg} />
				)}
			</div>
			<div className="mt-2 space-y-1 text-xs text-muted-foreground">
				<div className="flex flex-wrap items-baseline gap-x-2">
					<span className="text-yellow-700 dark:text-yellow-500 font-medium">
						<fbt desc="Label for urine avg in average stats">
							contains urine
						</fbt>
					</span>
					<span className="font-medium text-foreground">
						{stats.urine.toFixed(1)}
					</span>
					{prevStats && (
						<ComparisonValue current={stats.urine} previous={prevStats.urine} />
					)}
				</div>
				<div className="flex flex-wrap items-baseline gap-x-2 border-t border-border/50 pt-1">
					<span className="text-amber-800 dark:text-amber-500 font-medium">
						<fbt desc="Label for stool avg in average stats">contains poo</fbt>
					</span>
					<span className="font-medium text-foreground">
						{stats.stool.toFixed(1)}
					</span>
					{prevStats && (
						<ComparisonValue current={stats.stool} previous={prevStats.stool} />
					)}
				</div>
			</div>
		</StatsCard>
	);
}
