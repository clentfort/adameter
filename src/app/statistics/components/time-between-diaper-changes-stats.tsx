'use client';

import type { DiaperChange } from '@/types/diaper';
import { differenceInSeconds } from 'date-fns';
import { useMemo } from 'react';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import ComparisonValue from './comparison-value';
import StatsCard, { StatHeadline } from './stats-card';

interface TimeBetweenDiaperChangesStatsProps {
	comparisonDiaperChanges?: DiaperChange[];
	diaperChanges: DiaperChange[];
}

function calculateAvgTimeBetween(changes: DiaperChange[]) {
	if (changes.length < 2) return 0;
	const sorted = [...changes].sort((a, b) =>
		a.timestamp.localeCompare(b.timestamp),
	);
	let totalSeconds = 0;
	for (let i = 1; i < sorted.length; i++) {
		totalSeconds += differenceInSeconds(
			new Date(sorted[i].timestamp),
			new Date(sorted[i - 1].timestamp),
		);
	}
	return totalSeconds / (sorted.length - 1);
}

export default function TimeBetweenDiaperChangesStats({
	comparisonDiaperChanges,
	diaperChanges = [],
}: TimeBetweenDiaperChangesStatsProps) {
	const avgSeconds = useMemo(
		() => calculateAvgTimeBetween(diaperChanges),
		[diaperChanges],
	);
	const prevAvgSeconds = useMemo(
		() =>
			comparisonDiaperChanges
				? calculateAvgTimeBetween(comparisonDiaperChanges)
				: null,
		[comparisonDiaperChanges],
	);

	return (
		<StatsCard
			title={
				<fbt desc="Title for average time between diaper changes stat">
					Avg Time Between
				</fbt>
			}
		>
			<StatHeadline
				comparison={
					prevAvgSeconds !== null && (
						<ComparisonValue
							current={avgSeconds}
							inverse
							previous={prevAvgSeconds}
						/>
					)
				}
				value={formatDurationAbbreviated(avgSeconds)}
			/>
		</StatsCard>
	);
}
