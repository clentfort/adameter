import type { FeedingSession } from '@/types/feeding';
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

	const formatTotalDuration = (totalSeconds: number) => {
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;

		const parts: string[] = [];
		if (hours > 0) {
			parts.push(`${hours} Std.`);
		}
		if (minutes > 0) {
			parts.push(`${minutes} Min.`);
		}
		if (seconds > 0 || (hours === 0 && minutes === 0)) {
			// Show seconds if there are seconds, or if hours and minutes are zero (e.g. "0 Sek.")
			parts.push(`${seconds} Sek.`);
		}

		return parts.join(' ');
	};

	return (
		<StatsCard title={<fbt desc="totalFeedingDuration">Total feeding duration</fbt>}>
			<div className="text-2xl font-bold">
				{formatTotalDuration(totalDurationInSeconds)}
			</div>
		</StatsCard>
	);
}
