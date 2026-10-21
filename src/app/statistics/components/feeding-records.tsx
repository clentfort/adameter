import type { FeedingSession } from '@/types/feeding';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import { groupByDay, maxEntry, minEntry } from '../utils/group-by-day';
import { RecordCard } from './record-card';

interface FeedingRecordsProps {
	sessions: readonly FeedingSession[];
}

function calculateFeedingStats(
	sessions: readonly FeedingSession[],
	todayKey: string,
) {
	const sessionsByDay = groupByDay(
		sessions,
		(session) => session.startTime,
		() => ({ count: 0, duration: 0 }),
		(current, session) => ({
			count: current.count + 1,
			duration: current.duration + session.durationInSeconds,
		}),
		{ excludeDayKey: todayKey },
	);

	if (sessionsByDay.size === 0)
		return {
			fewestSessions: null,
			longestDuration: null,
			longestGap: { date: '', duration: 0 },
			mostSessions: null,
			shortestDuration: null,
		};

	const mostSessions = maxEntry(sessionsByDay, (val) => val.count);
	const fewestSessions = minEntry(sessionsByDay, (val) => val.count);
	const longestDuration = maxEntry(sessionsByDay, (val) => val.duration);
	const shortestDuration = minEntry(sessionsByDay, (val) => val.duration);

	// Calculate longest gap between two sessions
	const sortedSessions = [...sessions].sort((a, b) =>
		a.startTime.localeCompare(b.startTime),
	);

	let longestGap = { date: '', duration: 0 };
	for (let i = 1; i < sortedSessions.length; i++) {
		const previousSession = sortedSessions[i - 1];
		const currentSession = sortedSessions[i];
		const previousEnd =
			new Date(previousSession.startTime).getTime() +
			previousSession.durationInSeconds * 1000;
		const currentStart = new Date(currentSession.startTime).getTime();
		const gap = (currentStart - previousEnd) / 1000;
		if (gap > longestGap.duration) {
			longestGap = {
				date: currentSession.startTime,
				duration: gap,
			};
		}
	}
	return {
		fewestSessions,
		longestDuration,
		longestGap,
		mostSessions,
		shortestDuration,
	};
}

export default function FeedingRecords({ sessions = [] }: FeedingRecordsProps) {
	const todayKey = format(new Date(), 'yyyy-MM-dd');

	// Group sessions by day
	const {
		fewestSessions,
		longestDuration,
		longestGap,
		mostSessions,
		shortestDuration,
	} = useMemo(
		() => calculateFeedingStats(sessions, todayKey),
		[sessions, todayKey],
	);

	if (
		sessions.length === 0 ||
		!mostSessions ||
		!fewestSessions ||
		!longestDuration ||
		!shortestDuration
	)
		return null;

	return (
		<>
			{longestGap && longestGap.duration > 0 && (
				<RecordCard
					date={parseISO(longestGap.date)}
					title={
						<fbt desc="Title for the longest time between two feeding sessions">
							Longest gap between feedings
						</fbt>
					}
					value={formatDurationAbbreviated(longestGap.duration)}
				/>
			)}
			<RecordCard
				date={parseISO(mostSessions[0])}
				title={
					<fbt desc="Title for the day with the most feeding sessions">
						Most feedings in a day
					</fbt>
				}
				value={mostSessions[1].count}
			/>
			<RecordCard
				date={parseISO(fewestSessions[0])}
				title={
					<fbt desc="Title for the day with the fewest feeding sessions">
						Fewest feedings in a day
					</fbt>
				}
				value={fewestSessions[1].count}
			/>
			<RecordCard
				date={parseISO(longestDuration[0])}
				title={
					<fbt desc="Title for the day with the longest total feeding duration">
						Longest feeding day
					</fbt>
				}
				value={formatDurationAbbreviated(longestDuration[1].duration)}
			/>
			<RecordCard
				date={parseISO(shortestDuration[0])}
				title={
					<fbt desc="Title for the day with the shortest total feeding duration">
						Shortest feeding day
					</fbt>
				}
				value={formatDurationAbbreviated(shortestDuration[1].duration)}
			/>
		</>
	);
}
