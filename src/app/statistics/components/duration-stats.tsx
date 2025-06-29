import type { FeedingSession } from '@/types/feeding';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import StatsCard from './stats-card';

interface DurationStatsProps {
	sessions: FeedingSession[];
}

export default function DurationStats({ sessions = [] }: DurationStatsProps) {
	// Ensure sessions is an array
	const sessionsArray = Array.isArray(sessions) ? sessions : [];

	if (sessionsArray.length === 0) return null;

	// Calculate average durations
	let totalDuration = 0;
	let leftDuration = 0;
	let rightDuration = 0;
	let leftCount = 0;
	let rightCount = 0;

	sessionsArray.forEach((session) => {
		totalDuration += session.durationInSeconds;
		if (session.breast === 'left') {
			leftDuration += session.durationInSeconds;
			leftCount++;
		} else {
			rightDuration += session.durationInSeconds;
			rightCount++;
		}
	});

	const avgDuration = {
		left: leftCount > 0 ? Math.round(leftDuration / leftCount) : 0,
		right: rightCount > 0 ? Math.round(rightDuration / rightCount) : 0,
		total: Math.round(totalDuration / sessionsArray.length),
	};

	return (
		<StatsCard
			title={
				<fbt desc="Title for the average feeding duration statistics card">
					Average Feeding Duration
				</fbt>
			}
		>
			<div className="text-2xl font-bold">
				{formatDurationAbbreviated(avgDuration.total)}
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="Label for the average feeding duration on the left breast">
					Left Breast
				</fbt>
				:{' '}
				<span className="text-left-breast-dark">
					{formatDurationAbbreviated(avgDuration.left)}
				</span>
			</div>
			<div className="text-xs text-muted-foreground">
				<fbt desc="Label for the average feeding duration on the right breast">
					Right Breast
				</fbt>
				:{' '}
				<span className="text-right-breast-dark">
					{formatDurationAbbreviated(avgDuration.right)}
				</span>
			</div>
		</StatsCard>
	);
}
