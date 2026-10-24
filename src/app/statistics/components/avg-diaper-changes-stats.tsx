'use client';

import type { DiaperChange } from '@/types/diaper';
import { useMemo } from 'react';
import { getDaySpan } from '../utils/day-span';
import ComparisonValue from './comparison-value';
import StatsCard, { StatHeadline, StatInlineRow } from './stats-card';

interface AvgDiaperChangesStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
}

function calculateDetailedAvgPerDay(changes: DiaperChange[]) {
	if (changes.length === 0) return { avg: 0, stool: 0, urine: 0 };
	const days = getDaySpan(changes.map((c) => c.timestamp));

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
			<StatHeadline
				comparison={
					prevStats !== null && (
						<ComparisonValue current={stats.avg} previous={prevStats.avg} />
					)
				}
				value={stats.avg.toFixed(1)}
			/>
			<div className="mt-2 space-y-1">
				<StatInlineRow
					label={
						<span className="text-yellow-700 dark:text-yellow-500 font-medium">
							<fbt desc="Label for urine avg in average stats">
								contains urine
							</fbt>
						</span>
					}
					value={
						<>
							<span className="font-medium text-foreground">
								{stats.urine.toFixed(1)}
							</span>
							{prevStats && (
								<ComparisonValue
									current={stats.urine}
									previous={prevStats.urine}
								/>
							)}
						</>
					}
				/>
				<StatInlineRow
					className="border-t border-border/50 pt-1"
					label={
						<span className="text-amber-800 dark:text-amber-500 font-medium">
							<fbt desc="Label for stool avg in average stats">
								contains poo
							</fbt>
						</span>
					}
					value={
						<>
							<span className="font-medium text-foreground">
								{stats.stool.toFixed(1)}
							</span>
							{prevStats && (
								<ComparisonValue
									current={stats.stool}
									previous={prevStats.stool}
								/>
							)}
						</>
					}
				/>
			</div>
		</StatsCard>
	);
}
