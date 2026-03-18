import type { DiaperChange } from '@/types/diaper';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import StatsCard from './stats-card';

interface PottyRecordsProps {
	diaperChanges: readonly DiaperChange[];
}

function calculateMostPottyChanges(
	pottyChanges: readonly DiaperChange[],
	todayKey: string,
) {
	const changesByDay = new Map<string, number>();
	for (const change of pottyChanges) {
		const day = format(new Date(change.timestamp), 'yyyy-MM-dd');
		if (day === todayKey) continue;
		changesByDay.set(day, (changesByDay.get(day) || 0) + 1);
	}
	const days = Array.from(changesByDay.entries());
	if (days.length === 0) return null;
	return days.reduce((a, b) => (a[1] >= b[1] ? a : b));
}

function calculateLongestStreak(diaperChanges: readonly DiaperChange[]) {
	const sortedChanges = [...diaperChanges].sort((a, b) =>
		a.timestamp.localeCompare(b.timestamp),
	);

	let longestStreak = 0;
	let currentStreak = 0;
	let longestStart: string | null = null;
	let longestEnd: string | null = null;
	let currentStart: string | null = null;

	for (const change of sortedChanges) {
		const isSuccess =
			(change.pottyUrine || change.pottyStool) &&
			!change.containsUrine &&
			!change.containsStool;
		const isAccident = change.containsUrine || change.containsStool;

		if (isSuccess) {
			if (currentStreak === 0) {
				currentStart = change.timestamp;
			}
			currentStreak++;
			if (currentStreak >= longestStreak) {
				longestStreak = currentStreak;
				longestStart = currentStart;
				longestEnd = change.timestamp;
			}
		} else if (isAccident) {
			currentStreak = 0;
			currentStart = null;
		}
	}

	return {
		endDate: longestEnd,
		startDate: longestStart,
		streak: longestStreak,
	};
}

export default function PottyRecords({
	diaperChanges = [],
}: PottyRecordsProps) {
	const pottyChanges = useMemo(
		() => diaperChanges.filter((c) => c.pottyUrine || c.pottyStool),
		[diaperChanges],
	);
	const todayKey = format(new Date(), 'yyyy-MM-dd');
	// Group changes by day
	const mostChanges = useMemo(
		() => calculateMostPottyChanges(pottyChanges, todayKey),
		[pottyChanges, todayKey],
	);

	const longestStreak = useMemo(
		() => calculateLongestStreak(diaperChanges),
		[diaperChanges],
	);

	if (pottyChanges.length === 0) return null;

	return (
		<>
			{mostChanges && (
				<StatsCard
					title={
						<fbt desc="Title for the day with the most potty successes">
							Most potty hits in a day
						</fbt>
					}
				>
					<div className="text-2xl font-bold">{mostChanges[1]}</div>
					<div className="text-sm text-muted-foreground">
						{format(parseISO(mostChanges[0]), 'PP')}
					</div>
				</StatsCard>
			)}
			{longestStreak.streak > 0 && (
				<StatsCard
					title={
						<fbt desc="Title for the longest potty streak stat card">
							Longest potty streak
						</fbt>
					}
				>
					<div className="text-2xl font-bold">{longestStreak.streak}</div>
					<div className="text-sm text-muted-foreground">
						{longestStreak.startDate &&
							longestStreak.endDate &&
							(format(parseISO(longestStreak.startDate), 'yyyy-MM-dd') ===
							format(parseISO(longestStreak.endDate), 'yyyy-MM-dd')
								? format(parseISO(longestStreak.startDate), 'PP')
								: `${format(parseISO(longestStreak.startDate), 'PP')} - ${format(parseISO(longestStreak.endDate), 'PP')}`)}
					</div>
				</StatsCard>
			)}
		</>
	);
}
