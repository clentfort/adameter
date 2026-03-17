'use client';

import type { DiaperChange } from '@/types/diaper';
import { useMemo } from 'react';
import StatsCard from './stats-card';

interface PottyCurrentStreakStatsProps {
	diaperChanges: DiaperChange[];
}

function calculateCurrentStreak(diaperChanges: DiaperChange[]) {
	const sortedChanges = [...diaperChanges].sort((a, b) =>
		a.timestamp.localeCompare(b.timestamp),
	);

	let currentStreak = 0;

	for (const change of sortedChanges) {
		const isSuccess =
			(change.pottyUrine || change.pottyStool) &&
			!change.containsUrine &&
			!change.containsStool;
		const isAccident = change.containsUrine || change.containsStool;

		if (isSuccess) {
			currentStreak++;
		} else if (isAccident) {
			currentStreak = 0;
		}
	}

	return currentStreak;
}

export default function PottyCurrentStreakStats({
	diaperChanges = [],
}: PottyCurrentStreakStatsProps) {
	const currentStreak = useMemo(
		() => calculateCurrentStreak(diaperChanges),
		[diaperChanges],
	);

	return (
		<StatsCard
			title={
				<fbt desc="Title for current potty streak stat card">Potty Streak</fbt>
			}
		>
			<div className="text-2xl font-bold">{currentStreak}</div>
		</StatsCard>
	);
}
