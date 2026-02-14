import type { FeedingSession } from '@/types/feeding';
import { differenceInSeconds } from 'date-fns';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface TimeBetweenStatsProps {
	comparisonSessions?: FeedingSession[];
	sessions: FeedingSession[];
}

function calculateAvgTimeBetween(sessions: FeedingSession[]) {
	if (sessions.length <= 1) return 0;

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

	return timeBetweenCount > 0 ? Math.abs(totalTimeBetween / timeBetweenCount) : 0;
}

export default function TimeBetweenStats({
	comparisonSessions,
	sessions = [],
}: TimeBetweenStatsProps) {
	if (sessions.length <= 1) return null;

	const avgTime = calculateAvgTimeBetween(sessions);
	const prevAvgTime = comparisonSessions
		? calculateAvgTimeBetween(comparisonSessions)
		: null;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the average time between feedings statistics card">
					Time Between Feedings
				</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">
					{formatDurationAbbreviated(avgTime)}
				</div>
				{prevAvgTime ? (
					<ComparisonValue current={avgTime} inverse={true} previous={prevAvgTime} />
				) : null}
			</div>
		</StatsCard>
	);
}
