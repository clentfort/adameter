'use client';

import type { DiaperChange } from '@/types/diaper';
import ComparisonValue from './comparison-value';
import StatsCard, { StatHeadline, StatInlineRow } from './stats-card';

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
			<StatHeadline
				comparison={
					prevTotal !== undefined && (
						<ComparisonValue current={total} previous={prevTotal} />
					)
				}
				value={total}
			/>
			<div className="mt-2 space-y-1">
				<StatInlineRow
					label={
						<span className="text-yellow-700 dark:text-yellow-500 font-medium">
							<fbt desc="Label for urine count in total stats">
								contains urine
							</fbt>
						</span>
					}
					value={
						<>
							<span className="font-medium text-foreground">{urineCount}</span>
							{prevUrineCount !== undefined && (
								<ComparisonValue
									current={urineCount}
									previous={prevUrineCount}
								/>
							)}
						</>
					}
				/>
				<StatInlineRow
					className="border-t border-border/50 pt-1"
					label={
						<span className="text-amber-800 dark:text-amber-500 font-medium">
							<fbt desc="Label for stool count in total stats">
								contains poo
							</fbt>
						</span>
					}
					value={
						<>
							<span className="font-medium text-foreground">{stoolCount}</span>
							{prevStoolCount !== undefined && (
								<ComparisonValue
									current={stoolCount}
									previous={prevStoolCount}
								/>
							)}
						</>
					}
				/>
			</div>
		</StatsCard>
	);
}
