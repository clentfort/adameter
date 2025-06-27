import type { FeedingSession } from '@/types/feeding';
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

	const formatDuration = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes === 0) {
			return `${remainingSeconds} Sek.`;
		} else if (remainingSeconds === 0) {
			return `${minutes} Min.`;
		} else {
			return `${minutes} Min. ${remainingSeconds} Sek.`;
		}
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
				{formatDuration(avgDuration.total)}
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="Label for the average feeding duration on the left breast">
					Left Breast
				</fbt>
				:{' '}
				<span className="text-left-breast-dark">
					{formatDuration(avgDuration.left)}
				</span>
			</div>
			<div className="text-xs text-muted-foreground">
				<fbt desc="Label for the average feeding duration on the right breast">
					Right Breast
				</fbt>
				:{' '}
				<span className="text-right-breast-dark">
					{formatDuration(avgDuration.right)}
				</span>
			</div>
		</StatsCard>
	);
}
