import type { FeedingSession } from '@/types/feeding';
import StatsCard from './stats-card';

interface TotalFeedingsStatsProps {
	sessions: FeedingSession[];
}

export default function TotalFeedingsStats({
	sessions = [],
}: TotalFeedingsStatsProps) {
	if (sessions.length === 0) return null;

	const leftCount = sessions.filter((s) => s.breast === 'left').length;
	const rightCount = sessions.filter((s) => s.breast === 'right').length;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the total number of feedings statistics card">
					Total Feedings
				</fbt>
			}
		>
			<div className="text-2xl font-bold">{sessions.length}</div>
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="Label for the total number of feedings on the left breast">
					Left Breast
				</fbt>
				: <span className="text-left-breast-dark">{leftCount}</span>
			</div>
			<div className="text-xs text-muted-foreground">
				<fbt desc="Label for the total number of feedings on the right breast">
					Right Breast
				</fbt>
				: <span className="text-right-breast-dark">{rightCount}</span>
			</div>
		</StatsCard>
	);
}
