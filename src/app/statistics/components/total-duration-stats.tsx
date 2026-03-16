import type { FeedingSession } from '@/types/feeding';
import { useMemo } from 'react';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface TotalDurationStatsProps {
	comparisonSessions?: FeedingSession[];
	sessions: FeedingSession[];
}

export default function TotalDurationStats({
	comparisonSessions,
	sessions = [],
}: TotalDurationStatsProps) {
	// Calculate total duration
	const totalDurationInSeconds = useMemo(
		() => sessions.reduce((sum, session) => sum + session.durationInSeconds, 0),
		[sessions],
	);

	const prevTotalDurationInSeconds = useMemo(
		() =>
			comparisonSessions?.reduce(
				(sum, session) => sum + session.durationInSeconds,
				0,
			),
		[comparisonSessions],
	);

	if (sessions.length === 0) return null;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the total feeding duration statistics card">
					Total feeding duration
				</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">
					{formatDurationAbbreviated(totalDurationInSeconds)}
				</div>
				{prevTotalDurationInSeconds !== undefined && (
					<ComparisonValue
						current={totalDurationInSeconds}
						previous={prevTotalDurationInSeconds}
					/>
				)}
			</div>
		</StatsCard>
	);
}
