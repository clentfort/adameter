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
	const leakageCount = diaperChanges.filter((c) => c.leakage).length;

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
			<div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
				<div className="flex justify-between">
					<span>
						<fbt desc="Label for urine count">Urine</fbt>
					</span>
					<span className="font-medium">{urineCount}</span>
				</div>
				<div className="flex justify-between">
					<span>
						<fbt desc="Label for stool count">Stool</fbt>
					</span>
					<span className="font-medium text-amber-800 dark:text-amber-500">
						{stoolCount}
					</span>
				</div>
				<div className="flex justify-between col-span-2 border-t border-border/50 pt-1">
					<span>
						<fbt desc="Label for leakage count">Leakage</fbt>
					</span>
					<span className="font-medium text-red-600 dark:text-red-400">
						{leakageCount}
					</span>
				</div>
			</div>
		</StatsCard>
	);
}
