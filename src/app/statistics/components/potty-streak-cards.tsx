'use client';

import type { DiaperChange } from '@/types/diaper';
import { format } from 'date-fns';
import StatsCard from './stats-card';

interface PottyStreakCardsProps {
	diaperChanges: DiaperChange[];
}

function calculatePottyStreaks(diaperChanges: DiaperChange[]) {
	const sortedChanges = [...diaperChanges].sort((a, b) =>
		a.timestamp.localeCompare(b.timestamp),
	);

	let currentStreak = 0;
	let longestStreak = 0;
	let longestStreakEndTimestamp: string | undefined;

	for (const change of sortedChanges) {
		const isSuccess =
			(change.pottyUrine || change.pottyStool) &&
			!change.containsUrine &&
			!change.containsStool;
		const isAccident = change.containsUrine || change.containsStool;

		if (isSuccess) {
			currentStreak++;
			if (currentStreak >= longestStreak) {
				longestStreak = currentStreak;
				longestStreakEndTimestamp = change.timestamp;
			}
		} else if (isAccident) {
			currentStreak = 0;
		}
	}

	return {
		currentStreak,
		longestStreak,
		longestStreakEndTimestamp,
	};
}

export default function PottyStreakCards({
	diaperChanges = [],
}: PottyStreakCardsProps) {
	const { currentStreak, longestStreak, longestStreakEndTimestamp } =
		calculatePottyStreaks(diaperChanges);

	return (
		<>
			<StatsCard
				accentColor="#1d4ed8"
				title={
					<fbt desc="Label for current potty streak">Current Potty Streak</fbt>
				}
			>
				<div className="text-2xl font-bold">{currentStreak}</div>
			</StatsCard>
			<StatsCard
				accentColor="#1d4ed8"
				title={
					<fbt desc="Label for longest potty streak">Longest Potty Streak</fbt>
				}
			>
				<div className="text-2xl font-bold">{longestStreak}</div>
				{longestStreakEndTimestamp && (
					<div className="text-xs text-muted-foreground mt-1">
						{format(new Date(longestStreakEndTimestamp), 'PP')}
					</div>
				)}
			</StatsCard>
		</>
	);
}
