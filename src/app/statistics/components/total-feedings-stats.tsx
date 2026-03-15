import type { FeedingSession } from '@/types/feeding';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface TotalFeedingsStatsProps {
	comparisonSessions?: FeedingSession[];
	sessions: FeedingSession[];
}

export default function TotalFeedingsStats({
	comparisonSessions,
	sessions = [],
}: TotalFeedingsStatsProps) {
	if (sessions.length === 0) return null;

	const leftCount = sessions.filter((s) => s.type === 'breast' && s.breast === 'left').length;
	const rightCount = sessions.filter((s) => s.type === 'breast' && s.breast === 'right').length;
	const bottleCount = sessions.filter((s) => s.type === 'bottle').length;

	const prevLeftCount = comparisonSessions?.filter(
		(s) => s.type === 'breast' && s.breast === 'left',
	).length;
	const prevRightCount = comparisonSessions?.filter(
		(s) => s.type === 'breast' && s.breast === 'right',
	).length;
	const prevBottleCount = comparisonSessions?.filter(
		(s) => s.type === 'bottle',
	).length;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the total number of feedings statistics card">
					Total Feedings
				</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">{sessions.length}</div>
				{comparisonSessions !== undefined && (
					<ComparisonValue
						current={sessions.length}
						previous={comparisonSessions.length}
					/>
				)}
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="Label for the total number of feedings on the left breast">
					Left Breast
				</fbt>
				: <span className="text-left-breast-dark">{leftCount}</span>
				{prevLeftCount !== undefined && (
					<ComparisonValue current={leftCount} previous={prevLeftCount} />
				)}
			</div>
			<div className="text-xs text-muted-foreground">
				<fbt desc="Label for the total number of feedings on the right breast">
					Right Breast
				</fbt>
				: <span className="text-right-breast-dark">{rightCount}</span>
				{prevRightCount !== undefined && (
					<ComparisonValue current={rightCount} previous={prevRightCount} />
				)}
			</div>
			<div className="text-xs text-muted-foreground">
				<fbt desc="Label for the total number of bottle feedings">
					Bottle
				</fbt>
				: <span className="text-blue-700">{bottleCount}</span>
				{prevBottleCount !== undefined && (
					<ComparisonValue current={bottleCount} previous={prevBottleCount} />
				)}
			</div>
		</StatsCard>
	);
}
