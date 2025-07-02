import type { FeedingSession } from '@/types/feeding';
import { differenceInSeconds } from 'date-fns';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import StatsCard from './stats-card';

interface TimeBetweenStatsProps {
	sessions: FeedingSession[];
}

export default function TimeBetweenStats({
	sessions = [],
}: TimeBetweenStatsProps) {
	if (sessions.length <= 1) return null;

	// Sort sessions by start time (newest first)
	const sortedSessions = [...sessions].sort(
		(a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
	);

	// Calculate average time between feedings
	let totalTimeBetween = 0;
	let timeBetweenCount = 0;

	for (let i = 1; i < sortedSessions.length; i++) {
		const timeBetween = Math.abs(
			differenceInSeconds(
				new Date(sortedSessions[i].startTime),
				new Date(sortedSessions[i - 1].startTime),
			),
		);

		if (timeBetween > 0) {
			totalTimeBetween += timeBetween;
			timeBetweenCount++;
		}
	}

	const avgTime =
		timeBetweenCount > 0 ? Math.abs(totalTimeBetween / timeBetweenCount) : 0;

	return (
		<StatsCard
			title={(
				<fbt desc="Title for the average time between feedings statistics card">
					Time Between Feedings
				</fbt>
			).toString()}
		>
			<div className="text-2xl font-bold">
				{formatDurationAbbreviated(avgTime)}
			</div>
		</StatsCard>
	);
}
