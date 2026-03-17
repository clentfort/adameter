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
		</StatsCard>
	);
}
