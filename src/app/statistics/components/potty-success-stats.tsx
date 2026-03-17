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

function calculatePottyMetrics(changes: DiaperChange[]) {
	const total = changes.filter((c) => c.pottyUrine || c.pottyStool).length;
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
	return { avgPerDay, total };
}

export default function PottySuccessStats({
	comparisonDiaperChanges,
	diaperChanges = [],
}: PottySuccessStatsProps) {
	const metrics = useMemo(
		() => calculatePottyMetrics(diaperChanges),
		[diaperChanges],
	);
	const prevMetrics = useMemo(
		() =>
			comparisonDiaperChanges
				? calculatePottyMetrics(comparisonDiaperChanges)
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
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="Label for average potty success per day">Avg per day</fbt>:{' '}
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
		</StatsCard>
	);
}
