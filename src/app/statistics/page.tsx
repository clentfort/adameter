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
import TotalDurationStats from './components/total-duration-stats';
import TotalFeedingsStats from './components/total-feedings-stats';

export default function StatisticsPage() {
	const { value: diaperChanges } = useDiaperChanges();
	const { value: events } = useEvents();
	const { value: measurements } = useGrowthMeasurements();
	const { value: sessions } = useFeedingSessions();

	const [timeRange, setTimeRange] = useState<'7' | '14' | '30' | 'all'>('7');

	// Filter sessions based on selected time range
	const filteredSessions = (() => {
		if (timeRange === 'all') return [...sessions];

		const now = new Date();
		const daysToLookBack = Number.parseInt(timeRange);
		const cutoffDate = addDays(now, -daysToLookBack);
		return [...sessions].filter(
			(session) => new Date(session.startTime) >= cutoffDate,
		);
	})();

	// Filter diaper changes based on selected time range
	const filteredDiaperChanges = (() => {
		if (timeRange === 'all') return [...diaperChanges];

		const now = new Date();
		const daysToLookBack = Number.parseInt(timeRange);
		const cutoffDate = addDays(now, -daysToLookBack);
		return [...diaperChanges].filter(
			(change) => new Date(change.timestamp) >= cutoffDate,
		);
	})();

	return (
		<div className="w-full">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-semibold">
					<fbt desc="Title for the statistics page">Statistics</fbt>
				</h2>
				<Select
					onValueChange={(value) =>
						setTimeRange(value as '7' | '14' | '30' | 'all')
					}
					value={timeRange}
				>
					<SelectTrigger className="w-[140px]">
						<SelectValue
							placeholder={
								<fbt desc="Placeholder text for the time range select input on the statistics page">
									Time Range
								</fbt>
							}
						/>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7">
							<fbt desc="Option to display data for the last 7 days in statistics">
								Last 7 Days
							</fbt>
						</SelectItem>
						<SelectItem value="14">
							<fbt desc="Option to display data for the last 14 days in statistics">
								Last 14 Days
							</fbt>
						</SelectItem>
						<SelectItem value="30">
							<fbt desc="Option to display data for the last 30 days in statistics">
								Last 30 Days
							</fbt>
						</SelectItem>
						<SelectItem value="all">
							<fbt desc="Option to display all data in statistics">
								All Data
							</fbt>
						</SelectItem>
					</SelectContent>
				</Select>
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
