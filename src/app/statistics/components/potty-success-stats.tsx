'use client';

import type { DiaperChange } from '@/types/diaper';
import { useMemo } from 'react';
import { getDaySpan } from '../utils/day-span';
import ComparisonValue from './comparison-value';
import StatsCard, { StatBreakdownRow, StatHeadline } from './stats-card';

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
		const days = getDaySpan(changes.map((c) => c.timestamp));
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
			<StatHeadline
				comparison={
					prevMetrics && (
						<ComparisonValue
							current={metrics.total}
							previous={prevMetrics.total}
						/>
					)
				}
				value={metrics.total}
			/>
			<div className="mt-2 space-y-1">
				<StatBreakdownRow
					label={
						<span className="text-yellow-700 dark:text-yellow-500 font-medium">
							<fbt desc="Label for potty urine count in stats card">
								Urine caught
							</fbt>
						</span>
					}
					value={
						<>
							<span className="font-medium text-foreground">
								{metrics.urineCount}
							</span>
							{prevMetrics && (
								<ComparisonValue
									current={metrics.urineCount}
									previous={prevMetrics.urineCount}
								/>
							)}
						</>
					}
				/>
				<StatBreakdownRow
					className="border-t border-border/50 pt-1"
					label={
						<span className="text-amber-800 dark:text-amber-500 font-medium">
							<fbt desc="Label for potty stool count in stats card">
								Poo caught
							</fbt>
						</span>
					}
					value={
						<>
							<span className="font-medium text-foreground">
								{metrics.stoolCount}
							</span>
							{prevMetrics && (
								<ComparisonValue
									current={metrics.stoolCount}
									previous={prevMetrics.stoolCount}
								/>
							)}
						</>
					}
				/>
				<StatBreakdownRow
					className="border-t border-border/50 pt-1"
					label={
						<fbt desc="Label for average potty success per day in stats card">
							Avg per day
						</fbt>
					}
					value={
						<>
							<span className="font-medium text-foreground">
								{metrics.avgPerDay.toFixed(1)}
							</span>
							{prevMetrics && (
								<ComparisonValue
									current={metrics.avgPerDay}
									previous={prevMetrics.avgPerDay}
								/>
							)}
						</>
					}
				/>
			</div>
		</StatsCard>
	);
}
