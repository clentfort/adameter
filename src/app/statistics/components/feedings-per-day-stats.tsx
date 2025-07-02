import type { FeedingSession } from '@/types/feeding';
import { format } from 'date-fns';
import StatsCard from './stats-card';

interface FeedingsPerDayStatsProps {
	sessions: FeedingSession[];
}

export default function FeedingsPerDayStats({
	sessions = [],
}: FeedingsPerDayStatsProps) {
	if (sessions.length === 0) return null;

	// Group sessions by day
	const sessionsByDay = new Map<string, number>();
	sessions.forEach((session) => {
		const day = format(new Date(session.startTime), 'yyyy-MM-dd');
		sessionsByDay.set(day, (sessionsByDay.get(day) || 0) + 1);
	});

	const days = Array.from(sessionsByDay.keys());
	const totalDays = days.length;

	if (totalDays === 0) return null;

	const totalFeedings = Array.from(sessionsByDay.values()).reduce(
		(sum, count) => sum + count,
		0,
	);
	const avgFeedingsPerDay = totalFeedings / totalDays;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the average number of feedings per day statistics card">
					Feedings Per Day
				</fbt>
			}
		>
			<div className="text-2xl font-bold">{avgFeedingsPerDay.toFixed(1)}</div>
		</StatsCard>
	);
}
