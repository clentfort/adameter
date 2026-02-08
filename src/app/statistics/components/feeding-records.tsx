import type { FeedingSession } from '@/types/feeding';
import { format, parseISO } from 'date-fns';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import StatsCard from './stats-card';

interface FeedingRecordsProps {
	sessions: FeedingSession[];
}

export default function FeedingRecords({ sessions = [] }: FeedingRecordsProps) {
	if (sessions.length === 0) return null;

	// Group sessions by day
	const sessionsByDay = new Map<string, { count: number; duration: number }>();
	for (const session of sessions) {
		const day = format(new Date(session.startTime), 'yyyy-MM-dd');
		const current = sessionsByDay.get(day) || { count: 0, duration: 0 };
		sessionsByDay.set(day, {
			count: current.count + 1,
			duration: current.duration + session.durationInSeconds,
		});
	}

	const days = Array.from(sessionsByDay.entries());
	if (days.length === 0) return null;

	const mostSessions = days.reduce((a, b) => (a[1].count >= b[1].count ? a : b));
	const fewestSessions = days.reduce((a, b) =>
		a[1].count <= b[1].count ? a : b,
	);
	const longestDuration = days.reduce((a, b) =>
		a[1].duration >= b[1].duration ? a : b,
	);
	const shortestDuration = days.reduce((a, b) =>
		a[1].duration <= b[1].duration ? a : b,
	);

	return (
		<>
			<StatsCard
				title={
					<fbt desc="Title for the day with the most feeding sessions">
						Most feedings in a day
					</fbt>
				}
			>
				<div className="text-2xl font-bold">{mostSessions[1].count}</div>
				<div className="text-sm text-muted-foreground">
					{format(parseISO(mostSessions[0]), 'PP')}
				</div>
			</StatsCard>
			<StatsCard
				title={
					<fbt desc="Title for the day with the fewest feeding sessions">
						Fewest feedings in a day
					</fbt>
				}
			>
				<div className="text-2xl font-bold">{fewestSessions[1].count}</div>
				<div className="text-sm text-muted-foreground">
					{format(parseISO(fewestSessions[0]), 'PP')}
				</div>
			</StatsCard>
			<StatsCard
				title={
					<fbt desc="Title for the day with the longest total feeding duration">
						Longest feeding day
					</fbt>
				}
			>
				<div className="text-2xl font-bold">
					{formatDurationAbbreviated(longestDuration[1].duration)}
				</div>
				<div className="text-sm text-muted-foreground">
					{format(parseISO(longestDuration[0]), 'PP')}
				</div>
			</StatsCard>
			<StatsCard
				title={
					<fbt desc="Title for the day with the shortest total feeding duration">
						Shortest feeding day
					</fbt>
				}
			>
				<div className="text-2xl font-bold">
					{formatDurationAbbreviated(shortestDuration[1].duration)}
				</div>
				<div className="text-sm text-muted-foreground">
					{format(parseISO(shortestDuration[0]), 'PP')}
				</div>
			</StatsCard>
		</>
	);
}
