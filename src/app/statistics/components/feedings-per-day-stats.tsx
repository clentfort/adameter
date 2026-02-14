import type { FeedingSession } from '@/types/feeding';
import { format } from 'date-fns';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface FeedingsPerDayStatsProps {
	comparisonSessions?: FeedingSession[];
	sessions: FeedingSession[];
}

function calculateAvgFeedingsPerDay(sessions: FeedingSession[]) {
	if (sessions.length === 0) return 0;

	// Group sessions by day
	const sessionsByDay = new Map<string, number>();
	sessions.forEach((session) => {
		const day = format(new Date(session.startTime), 'yyyy-MM-dd');
		sessionsByDay.set(day, (sessionsByDay.get(day) || 0) + 1);
	});

	const days = Array.from(sessionsByDay.keys());
	const totalDays = days.length;

	if (totalDays === 0) return 0;

	const totalFeedings = Array.from(sessionsByDay.values()).reduce(
		(sum, count) => sum + count,
		0,
	);
	return totalFeedings / totalDays;
}

export default function FeedingsPerDayStats({
	comparisonSessions,
	sessions = [],
}: FeedingsPerDayStatsProps) {
	if (sessions.length === 0) return null;

	const avgFeedingsPerDay = calculateAvgFeedingsPerDay(sessions);
	const prevAvgFeedingsPerDay = comparisonSessions
		? calculateAvgFeedingsPerDay(comparisonSessions)
		: null;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the average number of feedings per day statistics card">
					Feedings Per Day
				</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">{avgFeedingsPerDay.toFixed(1)}</div>
				{prevAvgFeedingsPerDay !== null && (
					<ComparisonValue
						current={avgFeedingsPerDay}
						previous={prevAvgFeedingsPerDay}
					/>
				)}
			</div>
		</StatsCard>
	);
}
