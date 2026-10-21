import type { DiaperChange } from '@/types/diaper';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { groupByDay, maxEntry } from '../utils/group-by-day';
import { RecordCard } from './record-card';

interface PottyRecordsProps {
	diaperChanges: readonly DiaperChange[];
}

function calculateMostPottyChanges(
	pottyChanges: readonly DiaperChange[],
	todayKey: string,
) {
	const changesByDay = groupByDay(
		pottyChanges,
		(change) => change.timestamp,
		() => 0,
		(count) => count + 1,
		{ excludeDayKey: todayKey },
	);

	if (changesByDay.size === 0) return null;
	return maxEntry(changesByDay);
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
				<RecordCard
					date={parseISO(mostChanges[0])}
					title={
						<fbt desc="Title for the day with the most potty successes">
							Most potty hits in a day
						</fbt>
					}
					value={mostChanges[1]}
				/>
			)}
			{longestStreak.streak > 0 && (
				<RecordCard
					date={
						longestStreak.startDate
							? parseISO(longestStreak.startDate)
							: undefined
					}
					endDate={
						longestStreak.endDate ? parseISO(longestStreak.endDate) : undefined
					}
					title={
						<fbt desc="Title for the longest potty streak stat card">
							Longest potty streak
						</fbt>
					}
					value={longestStreak.streak}
				/>
			)}
		</>
	);
}
