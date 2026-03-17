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

function calculateAvgPerDay(changes: DiaperChange[]) {
	if (changes.length === 0) return 0;
	const oldest = new Date(
		Math.min(...changes.map((c) => new Date(c.timestamp).getTime())),
	);
	const newest = new Date(
		Math.max(...changes.map((c) => new Date(c.timestamp).getTime())),
	);
	const days = Math.max(1, differenceInDays(newest, oldest) + 1);
	return changes.length / days;
}

export default function AvgDiaperChangesStats({
	comparisonDiaperChanges,
	diaperChanges = [],
}: AvgDiaperChangesStatsProps) {
	const avg = useMemo(() => calculateAvgPerDay(diaperChanges), [diaperChanges]);
	const prevAvg = useMemo(
		() =>
			comparisonDiaperChanges
				? calculateAvgPerDay(comparisonDiaperChanges)
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
				<div className="text-2xl font-bold">{avg.toFixed(1)}</div>
				{prevAvg !== null && (
					<ComparisonValue current={avg} previous={prevAvg} />
				)}
			</div>
		</StatsCard>
	);
}
