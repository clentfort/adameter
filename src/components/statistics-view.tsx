'use client';

import { useState } from 'react';
import type { FeedingSession } from '@/types/feeding';
import type { DiaperChange } from '@/types/diaper';
import type { GrowthMeasurement } from '@/types/growth';
import type { Event } from '@/types/event';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import DurationStats from './statistics/duration-stats';
import TimeBetweenStats from './statistics/time-between-stats';
import FeedingsPerDayStats from './statistics/feedings-per-day-stats';
import TotalFeedingsStats from './statistics/total-feedings-stats';
import HeatMap from './statistics/heat-map';
import DiaperStats from './statistics/diaper-stats';
import GrowthChart from './growth-chart';
import { addDays } from 'date-fns';
import { useTranslate } from '@/utils/translate';

interface StatisticsViewProps {
	diaperChanges: DiaperChange[];
	events: Event[];
	measurements: GrowthMeasurement[];
	sessions: FeedingSession[];
}

export default function StatisticsView({
	diaperChanges = [],
	events = [],
	measurements = [],
	sessions = [],
}: StatisticsViewProps) {
	const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | 'all'>('7');
	const t = useTranslate();

	// Ensure sessions is an array
	const sessionsArray = Array.isArray(sessions) ? sessions : [];
	const diaperChangesArray = Array.isArray(diaperChanges) ? diaperChanges : [];
	const measurementsArray = Array.isArray(measurements) ? measurements : [];
	const eventsArray = Array.isArray(events) ? events : [];

	// Filter sessions based on selected time range
	const filteredSessions = (() => {
		if (timeRange === 'all') return sessionsArray;

		const now = new Date();
		const daysToLookBack = Number.parseInt(timeRange);
		const cutoffDate = addDays(now, -daysToLookBack);
		return sessionsArray.filter(
			(session) => new Date(session.startTime) >= cutoffDate,
		);
	})();

	// Filter diaper changes based on selected time range
	const filteredDiaperChanges = (() => {
		if (timeRange === 'all') return diaperChangesArray;

		const now = new Date();
		const daysToLookBack = Number.parseInt(timeRange);
		const cutoffDate = addDays(now, -daysToLookBack);
		return diaperChangesArray.filter(
			(change) => new Date(change.timestamp) >= cutoffDate,
		);
	})();

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold">{t('statistics')}</h2>
				<Select
					onValueChange={(value) =>
						setTimeRange(value as '7' | '14' | '30' | 'all')
					}
					value={timeRange}
				>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder={t('timeRange')} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7">{t('last7Days')}</SelectItem>
						<SelectItem value="14">{t('last14Days')}</SelectItem>
						<SelectItem value="30">{t('last30Days')}</SelectItem>
						<SelectItem value="all">{t('allData')}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{filteredSessions.length === 0 &&
			filteredDiaperChanges.length === 0 &&
			measurementsArray.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					{t('noDataAvailable')}
				</div>
			) : (
				<>
					<h3 className="text-lg font-medium mt-6 mb-4">{t('feedingTab')}</h3>
					{filteredSessions.length > 0 ? (
						<>
							<div className="grid grid-cols-2 gap-4">
								<DurationStats sessions={filteredSessions} />
								<TimeBetweenStats sessions={filteredSessions} />
								<FeedingsPerDayStats sessions={filteredSessions} />
								<TotalFeedingsStats sessions={filteredSessions} />
							</div>

							<HeatMap sessions={filteredSessions} />
						</>
					) : (
						<div className="text-center py-4 text-muted-foreground">
							{t('noFeedingDataAvailable')}
						</div>
					)}

					<h3 className="text-lg font-medium mt-8 mb-4">{t('diaperTab')}</h3>
					{filteredDiaperChanges.length > 0 ? (
						<DiaperStats diaperChanges={filteredDiaperChanges} />
					) : (
						<div className="text-center py-4 text-muted-foreground">
							{t('noDiaperDataAvailable')}
						</div>
					)}

					<h3 className="text-lg font-medium mt-8 mb-4">{t('growthTab')}</h3>
					{measurementsArray.length > 0 ? (
						<GrowthChart
							events={eventsArray}
							measurements={measurementsArray}
						/>
					) : (
						<div className="text-center py-4 text-muted-foreground">
							{t('noGrowthDataAvailable')}
						</div>
					)}
				</>
			)}
		</div>
	);
}
