import type { FeedingSession } from '@/types/feeding';
import { useMemo } from 'react';
import ComparisonValue from './comparison-value';
import StatsCard, { StatBreakdownRow, StatHeadline } from './stats-card';

interface TotalFeedingsStatsProps {
	comparisonSessions?: FeedingSession[];
	sessions: FeedingSession[];
}

function calculateBreastCounts(
	sessions: FeedingSession[],
	comparisonSessions?: FeedingSession[],
) {
	const leftCount = sessions.filter((s) => s.breast === 'left').length;
	const rightCount = sessions.filter((s) => s.breast === 'right').length;
	const prevLeftCount = comparisonSessions?.filter(
		(s) => s.breast === 'left',
	).length;
	const prevRightCount = comparisonSessions?.filter(
		(s) => s.breast === 'right',
	).length;
	return { leftCount, prevLeftCount, prevRightCount, rightCount };
}

export default function TotalFeedingsStats({
	comparisonSessions,
	sessions = [],
}: TotalFeedingsStatsProps) {
	const { leftCount, prevLeftCount, prevRightCount, rightCount } = useMemo(
		() => calculateBreastCounts(sessions, comparisonSessions),
		[sessions, comparisonSessions],
	);

	if (sessions.length === 0) return null;

	return (
		<StatsCard
			title={
				<fbt desc="Title for the total number of feedings statistics card">
					Total Feedings
				</fbt>
			}
		>
			<StatHeadline
				comparison={
					comparisonSessions !== undefined && (
						<ComparisonValue
							current={sessions.length}
							previous={comparisonSessions.length}
						/>
					)
				}
				value={sessions.length}
			/>
			<StatBreakdownRow
				className="mt-1"
				label={
					<fbt desc="Label for the total number of feedings on the left breast">
						Left Breast
					</fbt>
				}
				value={
					<>
						<span className="text-left-breast-dark">{leftCount}</span>
						{prevLeftCount !== undefined && (
							<ComparisonValue current={leftCount} previous={prevLeftCount} />
						)}
					</>
				}
			/>
			<StatBreakdownRow
				label={
					<fbt desc="Label for the total number of feedings on the right breast">
						Right Breast
					</fbt>
				}
				value={
					<>
						<span className="text-right-breast-dark">{rightCount}</span>
						{prevRightCount !== undefined && (
							<ComparisonValue current={rightCount} previous={prevRightCount} />
						)}
					</>
				}
			/>
		</StatsCard>
	);
}
