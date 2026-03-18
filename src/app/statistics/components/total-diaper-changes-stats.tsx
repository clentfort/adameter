'use client';

import type { DiaperChange } from '@/types/diaper';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface TotalDiaperChangesStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
}

export default function TotalDiaperChangesStats({
	comparisonDiaperChanges,
	diaperChanges = [],
}: TotalDiaperChangesStatsProps) {
	const total = diaperChanges.length;
	const prevTotal = comparisonDiaperChanges?.length;

	const urineCount = diaperChanges.filter((c) => c.containsUrine).length;
	const stoolCount = diaperChanges.filter((c) => c.containsStool).length;

	const prevUrineCount = comparisonDiaperChanges?.filter(
		(c) => c.containsUrine,
	).length;
	const prevStoolCount = comparisonDiaperChanges?.filter(
		(c) => c.containsStool,
	).length;

	return (
		<StatsCard
			title={
				<fbt desc="Title for total diaper changes stat">Total Changes</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">{total}</div>
				{prevTotal !== undefined && (
					<ComparisonValue current={total} previous={prevTotal} />
				)}
			</div>
			<div className="mt-2 space-y-1 text-xs text-muted-foreground">
				<div className="flex flex-wrap items-baseline gap-x-2">
					<span className="text-yellow-700 dark:text-yellow-500 font-medium">
						<fbt desc="Label for urine count in total stats">
							contains urine
						</fbt>
					</span>
					<span className="font-medium text-foreground">{urineCount}</span>
					{prevUrineCount !== undefined && (
						<ComparisonValue current={urineCount} previous={prevUrineCount} />
					)}
				</div>
				<div className="flex flex-wrap items-baseline gap-x-2 border-t border-border/50 pt-1">
					<span className="text-amber-800 dark:text-amber-500 font-medium">
						<fbt desc="Label for stool count in total stats">contains poo</fbt>
					</span>
					<span className="font-medium text-foreground">{stoolCount}</span>
					{prevStoolCount !== undefined && (
						<ComparisonValue current={stoolCount} previous={prevStoolCount} />
					)}
				</div>
			</div>
		</StatsCard>
	);
}
