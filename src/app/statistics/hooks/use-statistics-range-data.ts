import type { DiaperChange } from '@/types/diaper';
import type { FeedingSession } from '@/types/feeding';
import type { DateRange } from '@/utils/get-range-dates';
import { useMemo } from 'react';
import { filterByRange } from '../utils/filter-by-range';

interface UseStatisticsRangeDataOptions {
	diaperChanges: readonly DiaperChange[];
	primary: DateRange;
	secondary?: DateRange;
	sessions: readonly FeedingSession[];
}

interface UseStatisticsRangeDataResult {
	comparisonDiaperChanges?: DiaperChange[];
	comparisonSessions?: FeedingSession[];
	filteredDiaperChanges: DiaperChange[];
	filteredSessions: FeedingSession[];
}

export function useStatisticsRangeData({
	diaperChanges,
	primary,
	secondary,
	sessions,
}: UseStatisticsRangeDataOptions): UseStatisticsRangeDataResult {
	const filteredSessions = useMemo(
		() => filterByRange(sessions, primary, (session) => session.startTime),
		[sessions, primary],
	);

	const comparisonSessions = useMemo(
		() =>
			secondary
				? filterByRange(sessions, secondary, (session) => session.startTime)
				: undefined,
		[sessions, secondary],
	);

	const filteredDiaperChanges = useMemo(
		() => filterByRange(diaperChanges, primary, (change) => change.timestamp),
		[diaperChanges, primary],
	);

	const comparisonDiaperChanges = useMemo(
		() =>
			secondary
				? filterByRange(diaperChanges, secondary, (change) => change.timestamp)
				: undefined,
		[diaperChanges, secondary],
	);

	return {
		comparisonDiaperChanges,
		comparisonSessions,
		filteredDiaperChanges,
		filteredSessions,
	};
}
