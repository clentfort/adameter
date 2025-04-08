import StatsCard from './stats-card';
import type { FeedingSession } from '@/types/feeding';
import { useTranslate } from '@/utils/translate';

interface DurationStatsProps {
	sessions: FeedingSession[];
}

export default function DurationStats({ sessions = [] }: DurationStatsProps) {
	// Ensure sessions is an array
	const sessionsArray = Array.isArray(sessions) ? sessions : [];

	const t = useTranslate();

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
		total: Math.round(totalDuration / sessionsArray.length),
		left: leftCount > 0 ? Math.round(leftDuration / leftCount) : 0,
		right: rightCount > 0 ? Math.round(rightDuration / rightCount) : 0,
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
		<StatsCard title={t('averageFeedingDuration')}>
			<div className="text-2xl font-bold">
				{formatDuration(avgDuration.total)}
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				{t('leftBreast')}:{' '}
				<span className="text-left-breast-dark">
					{formatDuration(avgDuration.left)}
				</span>
			</div>
			<div className="text-xs text-muted-foreground">
				{t('rightBreast')}:{' '}
				<span className="text-right-breast-dark">
					{formatDuration(avgDuration.right)}
				</span>
			</div>
		</StatsCard>
	);
}
