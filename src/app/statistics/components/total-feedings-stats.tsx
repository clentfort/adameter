import type { FeedingSession } from '@/types/feeding';
import StatsCard from './stats-card';

interface TotalFeedingsStatsProps {
	sessions: FeedingSession[];
}

export default function TotalFeedingsStats({
	sessions = [],
}: TotalFeedingsStatsProps) {
	// Ensure sessions is an array
	const sessionsArray = Array.isArray(sessions) ? sessions : [];

	if (sessionsArray.length === 0) return null;

	const leftCount = sessionsArray.filter((s) => s.breast === 'left').length;
	const rightCount = sessionsArray.filter((s) => s.breast === 'right').length;

	return (
		<StatsCard title=<fbt desc="totalFeedings">Total Feedings</fbt>>
			<div className="text-2xl font-bold">{sessionsArray.length}</div>
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="leftBreast">Left Breast</fbt>:{' '}
				<span className="text-left-breast-dark">{leftCount}</span>
			</div>
			<div className="text-xs text-muted-foreground">
				<fbt desc="rightBreast">Right Breast</fbt>:{' '}
				<span className="text-right-breast-dark">{rightCount}</span>
			</div>
		</StatsCard>
	);
}
