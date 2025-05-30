'use client';

import { addDays } from 'date-fns';
import { useState } from 'react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useEvents } from '@/hooks/use-events';
import { useFeedingSessions } from '@/hooks/use-feeding-sessions';
import { useGrowthMeasurements } from '@/hooks/use-growth-measurements';
import DiaperStats from './components/diaper-stats';
import DurationStats from './components/duration-stats';
import FeedingsPerDayStats from './components/feedings-per-day-stats';
import GrowthChart from './components/growth-chart';
import HeatMap from './components/heat-map';
import TimeBetweenStats from './components/time-between-stats';
import TotalFeedingsStats from './components/total-feedings-stats';

export default function StatisticsPage() {
	const { value: diaperChanges } = useDiaperChanges();
	const { value: events } = useEvents();
	const { value: measurements } = useGrowthMeasurements();
	const { value: sessions } = useFeedingSessions();

	const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | 'all'>('7');

	// Filter sessions based on selected time range
	const filteredSessions = (() => {
		if (timeRange === 'all') return sessions;

		const now = new Date();
		const daysToLookBack = Number.parseInt(timeRange);
		const cutoffDate = addDays(now, -daysToLookBack);
		return sessions.filter(
			(session) => new Date(session.startTime) >= cutoffDate,
		);
	})();

	// Filter diaper changes based on selected time range
	const filteredDiaperChanges = (() => {
		if (timeRange === 'all') return diaperChanges;

		const now = new Date();
		const daysToLookBack = Number.parseInt(timeRange);
		const cutoffDate = addDays(now, -daysToLookBack);
		return diaperChanges.filter(
			(change) => new Date(change.timestamp) >= cutoffDate,
		);
	})();

	return (
		<div className="w-full">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">
					<fbt desc="statistics">Statistics</fbt>
				</h2>
				<Select
					onValueChange={(value) =>
						setTimeRange(value as '7' | '14' | '30' | 'all')
					}
					value={timeRange}
				>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder=<fbt desc="timeRange">Time Range</fbt> />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7">
							<fbt desc="last7Days">Last 7 Days</fbt>
						</SelectItem>
						<SelectItem value="14">
							<fbt desc="last14Days">Last 14 Days</fbt>
						</SelectItem>
						<SelectItem value="30">
							<fbt desc="last30Days">Last 30 Days</fbt>
						</SelectItem>
						<SelectItem value="all">
							<fbt desc="allData">All Data</fbt>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{filteredSessions.length === 0 &&
			filteredDiaperChanges.length === 0 &&
			measurements.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					<fbt desc="noDataAvailable">
						No data available for the selected time range.
					</fbt>
				</div>
			) : (
				<>
					<h3 className="text-lg font-medium mt-6 mb-4">
						<fbt desc="feedingTab">Feeding</fbt>
					</h3>
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
							<fbt desc="noFeedingDataAvailable">
								No feeding data available for the selected time range.
							</fbt>
						</div>
					)}

					<h3 className="text-lg font-medium mt-8 mb-4">
						<fbt desc="diaperTab">Diaper</fbt>
					</h3>
					{filteredDiaperChanges.length > 0 ? (
						<DiaperStats diaperChanges={filteredDiaperChanges} />
					) : (
						<div className="text-center py-4 text-muted-foreground">
							<fbt desc="noDiaperDataAvailable">
								No diaper data available for the selected time range.
							</fbt>
						</div>
					)}

					<h3 className="text-lg font-medium mt-8 mb-4">
						<fbt desc="growthTab">Growth</fbt>
					</h3>
					{measurements.length > 0 ? (
						<GrowthChart events={events} measurements={measurements} />
					) : (
						<div className="text-center py-4 text-muted-foreground">
							<fbt desc="noGrowthDataAvailable">No growth data available.</fbt>
						</div>
					)}
				</>
			)}
		</div>
	);
}
