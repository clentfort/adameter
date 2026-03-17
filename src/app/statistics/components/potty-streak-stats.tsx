'use client';

import type { DiaperChange } from '@/types/diaper';
import { useMemo } from 'react';
import StatsCard from './stats-card';

interface PottyStreakStatsProps {
	diaperChanges: DiaperChange[];
}

function calculatePottyStreaks(diaperChanges: DiaperChange[]) {
	const sortedChanges = [...diaperChanges].sort((a, b) =>
		a.timestamp.localeCompare(b.timestamp),
	);

	let currentStreak = 0;
	let longestStreak = 0;
	const streaks: number[] = [];

	for (const change of sortedChanges) {
		const isSuccess =
			(change.pottyUrine || change.pottyStool) &&
			!change.containsUrine &&
			!change.containsStool;
		const isAccident = change.containsUrine || change.containsStool;

		if (isSuccess) {
			currentStreak++;
			if (currentStreak > longestStreak) {
				longestStreak = currentStreak;
			}
		} else if (isAccident) {
			if (currentStreak > 0) {
				streaks.push(currentStreak);
			}
			currentStreak = 0;
		}
	}

	if (currentStreak > 0) {
		streaks.push(currentStreak);
	}

	const avgStreak =
		streaks.length > 0
			? streaks.reduce((a, b) => a + b, 0) / streaks.length
			: 0;

	return {
		avgStreak,
		currentStreak,
		longestStreak,
	};
}

export default function PottyStreakStats({
	diaperChanges = [],
}: PottyStreakStatsProps) {
	const { avgStreak, currentStreak, longestStreak } = useMemo(
		() => calculatePottyStreaks(diaperChanges),
		[diaperChanges],
	);

	return (
		<StatsCard
			title={
				<fbt desc="Title for potty streak statistics card">Potty Streaks</fbt>
			}
		>
			<div className="flex items-baseline justify-between">
				<div>
					<p className="text-xs text-muted-foreground">
						<fbt desc="Label for current potty streak">Current</fbt>
					</p>
					<p className="text-xl font-bold">{currentStreak}</p>
				</div>
				<div>
					<p className="text-xs text-muted-foreground">
						<fbt desc="Label for longest potty streak">Longest</fbt>
					</p>
					<p className="text-xl font-bold">{longestStreak}</p>
				</div>
				<div>
					<p className="text-xs text-muted-foreground">
						<fbt desc="Label for average potty streak">Average</fbt>
					</p>
					<p className="text-xl font-bold">{avgStreak.toFixed(1)}</p>
				</div>
			</div>
		</StatsCard>
	);
}
