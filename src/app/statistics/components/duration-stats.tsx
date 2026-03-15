import type { FeedingSession } from '@/types/feeding';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import ComparisonValue from './comparison-value';
import StatsCard from './stats-card';

interface DurationStatsProps {
	comparisonSessions?: FeedingSession[];
	sessions: FeedingSession[];
}

function calculateAvgDuration(sessions: FeedingSession[]) {
	if (sessions.length === 0) return { left: 0, right: 0, total: 0 };

	let totalDuration = 0;
	let leftDuration = 0;
	let rightDuration = 0;
	let leftCount = 0;
	let rightCount = 0;

	sessions.forEach((session) => {
		totalDuration += session.durationInSeconds;
		if (session.breast === 'left') {
			leftDuration += session.durationInSeconds;
			leftCount++;
		} else {
			rightDuration += session.durationInSeconds;
			rightCount++;
		}
	});

	return {
		left: leftCount > 0 ? Math.round(leftDuration / leftCount) : 0,
		right: rightCount > 0 ? Math.round(rightDuration / rightCount) : 0,
		total: Math.round(totalDuration / sessions.length),
	};
}

export default function DurationStats({
	comparisonSessions,
	sessions = [],
}: DurationStatsProps) {
	if (sessions.length === 0) return null;

	const avgDuration = calculateAvgDuration(sessions);
	const prevAvgDuration = comparisonSessions
		? calculateAvgDuration(comparisonSessions)
		: null;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the average feeding duration statistics card">
					Average Feeding Duration
				</fbt>
			}
		>
			<div className="flex items-baseline">
				<div className="text-2xl font-bold">
					{formatDurationAbbreviated(avgDuration.total)}
				</div>
				{prevAvgDuration && (
					<ComparisonValue
						current={avgDuration.total}
						previous={prevAvgDuration.total}
					/>
				)}
			</div>
			<div className="text-xs text-muted-foreground mt-1">
				<fbt desc="Label for the average feeding duration on the left breast">
					Left Breast
				</fbt>
				:{' '}
				<span className="text-left-breast-dark">
					{formatDurationAbbreviated(avgDuration.left)}
				</span>
				{prevAvgDuration && (
					<ComparisonValue
						current={avgDuration.left}
						previous={prevAvgDuration.left}
					/>
				)}
			</div>
			<div className="text-xs text-muted-foreground">
				<fbt desc="Label for the average feeding duration on the right breast">
					Right Breast
				</fbt>
				:{' '}
				<span className="text-right-breast-dark">
					{formatDurationAbbreviated(avgDuration.right)}
				</span>
				{prevAvgDuration && (
					<ComparisonValue
						current={avgDuration.right}
						previous={prevAvgDuration.right}
					/>
				)}
			</div>
		</StatsCard>
	);
}
