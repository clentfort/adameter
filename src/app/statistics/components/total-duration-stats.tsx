import type { FeedingSession } from '@/types/feeding';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import StatsCard from './stats-card';

interface TotalDurationStatsProps {
	sessions: FeedingSession[];
}

export default function TotalDurationStats({
	sessions = [],
}: TotalDurationStatsProps) {
	// Ensure sessions is an array
	const sessionsArray = Array.isArray(sessions) ? sessions : [];

	if (sessionsArray.length === 0) return null;

	// Calculate total duration
	const totalDurationInSeconds = sessionsArray.reduce(
		(sum, session) => sum + session.durationInSeconds,
		0,
	);

	return (
		<StatsCard
			title={
				<fbt desc="Title for the total feeding duration statistics card">
					Total feeding duration
				</fbt>
			}
		>
			<div className="text-2xl font-bold">
				{formatDurationAbbreviated(totalDurationInSeconds)}
			</div>
		</StatsCard>
	);
}
