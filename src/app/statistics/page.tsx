'use client';

import { addDays, endOfDay, startOfDay } from 'date-fns';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useEvents } from '@/hooks/use-events';
import { useFeedingSessions } from '@/hooks/use-feeding-sessions';
import { useGrowthMeasurements } from '@/hooks/use-growth-measurements';
import DateRangePicker from './components/date-range-picker';
import DiaperStats from './components/diaper-stats';
import DurationStats from './components/duration-stats';
import FeedingsPerDayStats from './components/feedings-per-day-stats';
import GrowthChart from './components/growth-chart';
import HeatMap from './components/heat-map';
import TimeBetweenStats from './components/time-between-stats';
import TotalDurationStats from './components/total-duration-stats';
import TotalFeedingsStats from './components/total-feedings-stats';

type TimeRangePreset = '7' | '14' | '30' | 'all';

export default function StatisticsPage() {
	const { value: diaperChanges } = useDiaperChanges();
	const { value: events } = useEvents();
	const { value: measurements } = useGrowthMeasurements();
	const { value: sessions } = useFeedingSessions();

	const [timeRange, setTimeRange] = useState<TimeRangePreset | DateRange>('7');

	// Filter sessions based on selected time range
	const filteredSessions = (() => {
		if (timeRange === 'all') return [...sessions];

		const now = new Date();
		let startDate: Date;
		const endDate = endOfDay(now);

		if (typeof timeRange === 'string') {
			const daysToLookBack = Number.parseInt(timeRange);
			startDate = startOfDay(addDays(now, -daysToLookBack));
		} else {
			startDate = startOfDay(timeRange.from ?? now);
		}

		return [...sessions].filter((session) => {
			const sessionDate = new Date(session.startTime);
			return sessionDate >= startDate && sessionDate <= endDate;
		});
	})();

	// Filter diaper changes based on selected time range
	const filteredDiaperChanges = (() => {
		if (timeRange === 'all') return [...diaperChanges];

		const now = new Date();
		let startDate: Date;
		const endDate = endOfDay(now);

		if (typeof timeRange === 'string') {
			const daysToLookBack = Number.parseInt(timeRange);
			startDate = startOfDay(addDays(now, -daysToLookBack));
		} else {
			startDate = startOfDay(timeRange.from ?? now);
		}

		return [...diaperChanges].filter((change) => {
			const changeDate = new Date(change.timestamp);
			return changeDate >= startDate && changeDate <= endDate;
		});
	})();

	return (
		<div className="w-full">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">
					<fbt desc="Title for the statistics page">Statistics</fbt>
				</h2>
				<DateRangePicker value={timeRange} onValueChange={setTimeRange} />
			</div>
			{filteredSessions.length === 0 &&
			filteredDiaperChanges.length === 0 &&
			measurements.length === 0 ? (
				<div className="text-center py-8 text-muted-foreground">
					<fbt desc="Message shown when no data is available for the selected time range on the statistics page">
						No data available for the selected time range.
					</fbt>
				</div>
			) : (
				<>
					<h3 className="text-lg font-medium mt-6 mb-4">
						<fbt desc="Subtitle for the feeding statistics section">
							Feeding
						</fbt>
					</h3>
					{filteredSessions.length > 0 ? (
						<>
							<div className="grid grid-cols-2 gap-4">
								<DurationStats sessions={filteredSessions} />
								<TotalDurationStats sessions={filteredSessions} />
								<TimeBetweenStats sessions={filteredSessions} />
								<FeedingsPerDayStats sessions={filteredSessions} />
								<TotalFeedingsStats sessions={filteredSessions} />
								<HeatMap className="col-span-2" sessions={filteredSessions} />
							</div>
						</>
					) : (
						<div className="text-center py-4 text-muted-foreground">
							<fbt desc="Message shown when no feeding data is available for the selected time range">
								No feeding data available for the selected time range.
							</fbt>
						</div>
					)}

					<h3 className="text-lg font-medium mt-8 mb-4">
						<fbt desc="Subtitle for the diaper statistics section">Diaper</fbt>
					</h3>
					{filteredDiaperChanges.length > 0 ? (
						<DiaperStats diaperChanges={filteredDiaperChanges} />
					) : (
						<div className="text-center py-4 text-muted-foreground">
							<fbt desc="Message shown when no diaper data is available for the selected time range">
								No diaper data available for the selected time range.
							</fbt>
						</div>
					)}

					<h3 className="text-lg font-medium mt-8 mb-4">
						<fbt desc="Subtitle for the growth statistics section">Growth</fbt>
					</h3>
					{measurements.length > 0 ? (
						<GrowthChart events={[...events]} measurements={[...measurements]} />
					) : (
						<div className="text-center py-4 text-muted-foreground">
							<fbt desc="Message shown when no growth data is available">
								No growth data available.
							</fbt>
						</div>
					)}
				</>
			)}
		</div>
	);
}
