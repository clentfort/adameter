import StatsCard from './stats-card';
import type { FeedingSession } from '@/types/feeding';
import { useTranslate } from '@/utils/translate';

interface TotalFeedingsStatsProps {
	sessions: FeedingSession[];
}

export default function TotalFeedingsStats({
	sessions = [],
}: TotalFeedingsStatsProps) {
	const t = useTranslate();
	// Ensure sessions is an array
	const sessionsArray = Array.isArray(sessions) ? sessions : [];

	if (sessionsArray.length === 0) return null;

	const leftCount = sessionsArray.filter((s) => s.breast === 'left').length;
	const rightCount = sessionsArray.filter((s) => s.breast === 'right').length;

	return (
		<StatsCard title={t('totalFeedings')}>
			<div className="text-2xl font-bold">{sessionsArray.length}</div>
			<div className="text-xs text-muted-foreground mt-1">
				{t('leftBreast')}:{' '}
				<span className="text-left-breast-dark">{leftCount}</span>
			</div>
			<div className="text-xs text-muted-foreground">
				{t('rightBreast')}:{' '}
				<span className="text-right-breast-dark">{rightCount}</span>
			</div>
		</StatsCard>
	);
}
