'use client';

import type { TimeRange } from '@/utils/get-range-dates';
import { addDays, format, isWithinInterval } from 'date-fns';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { getRangeDates } from '@/utils/get-range-dates';
import DiaperRecords from './components/diaper-records';
import DiaperStats from './components/diaper-stats';
import DurationStats from './components/duration-stats';
import FeedingRecords from './components/feeding-records';
import FeedingsPerDayStats from './components/feedings-per-day-stats';
import GrowthChart from './components/growth-chart';
import HeatMap from './components/heat-map';
import TimeBetweenStats from './components/time-between-stats';
import TotalDurationStats from './components/total-duration-stats';
import TotalFeedingsStats from './components/total-feedings-stats';
import YearlyActivityHeatMap from './components/yearly-activity-heat-map';

export default function StatisticsPage() {
	const { value: diaperChanges } = useDiaperChanges();
	const { value: events } = useEvents();
	const { value: measurements } = useGrowthMeasurements();
	const { value: sessions } = useFeedingSessions();

	const [timeRange, setTimeRange] = useState<TimeRange>('7');
	const [customRange, setCustomRange] = useState({
		from: dateToDateInputValue(addDays(new Date(), -7)),
		to: dateToDateInputValue(new Date()),
	});

	const { primary, secondary } = useMemo(
		() =>
			getRangeDates(
				timeRange,
				timeRange === 'custom' ? customRange : undefined,
			),
		[timeRange, customRange],
	);

	// Filter sessions based on selected time range
	const filteredSessions = useMemo(
		() =>
			sessions.filter((session) =>
				isWithinInterval(new Date(session.startTime), {
					end: primary.to,
					start: primary.from,
				}),
			),
		[sessions, primary],
	);

	const comparisonSessions = useMemo(
		() =>
			secondary
				? sessions.filter((session) =>
						isWithinInterval(new Date(session.startTime), {
							end: secondary.to,
							start: secondary.from,
						}),
					)
				: undefined,
		[sessions, secondary],
	);

	// Filter diaper changes based on selected time range
	const filteredDiaperChanges = useMemo(
		() =>
			diaperChanges.filter((change) =>
				isWithinInterval(new Date(change.timestamp), {
					end: primary.to,
					start: primary.from,
				}),
			),
		[diaperChanges, primary],
	);

	const comparisonDiaperChanges = useMemo(
		() =>
			secondary
				? diaperChanges.filter((change) =>
						isWithinInterval(new Date(change.timestamp), {
							end: secondary.to,
							start: secondary.from,
						}),
					)
				: undefined,
		[diaperChanges, secondary],
	);

	return (
		<div className="w-full">
			<div className="flex flex-col gap-4 mb-6">
				<div className="flex justify-between items-start">
					<h2 className="text-xl font-semibold pt-1">
						<fbt desc="Title for the statistics page">Statistics</fbt>
					</h2>
					<div className="flex flex-col items-end gap-1">
						<Select
							onValueChange={(value) => setTimeRange(value as TimeRange)}
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
								<SelectItem value="custom">
									<fbt desc="Option to display a custom time range in statistics">
										Custom Range
									</fbt>
								</SelectItem>
								<SelectItem value="all">
									<fbt desc="Option to display all data in statistics">
										All Data
									</fbt>
								</SelectItem>
							</SelectContent>
						</Select>
						{secondary && (
							<div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
								<fbt desc="Label for the comparison date range in statistics">
									Comparing to:{' '}
									<fbt:param name="from">
										{format(secondary.from, 'MMM d')}
									</fbt:param>{' '}
									-{' '}
									<fbt:param name="to">
										{format(secondary.to, 'MMM d')}
									</fbt:param>
								</fbt>
							</div>
						)}
					</div>
				</div>

				{timeRange === 'custom' && (
					<div className="flex items-center gap-4 justify-end">
						<div className="flex items-center gap-2">
							<Label className="text-xs text-muted-foreground" htmlFor="from">
								<fbt desc="Label for the start date of a custom time range">
									From
								</fbt>
							</Label>
							<Input
								className="w-[140px]"
								id="from"
								onChange={(e) =>
									setCustomRange((prev) => ({ ...prev, from: e.target.value }))
								}
								type="date"
								value={customRange.from}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Label className="text-xs text-muted-foreground" htmlFor="to">
								<fbt desc="Label for the end date of a custom time range">
									To
								</fbt>
							</Label>
							<Input
								className="w-[140px]"
								id="to"
								onChange={(e) =>
									setCustomRange((prev) => ({ ...prev, to: e.target.value }))
								}
								type="date"
								value={customRange.to}
							/>
						</div>
					</div>
				)}
			</div>
			{filteredSessions.length === 0 &&
			filteredDiaperChanges.length === 0 &&
			measurements.length === 0 ? (
				<div
					className="text-center py-8 text-muted-foreground"
					data-testid="no-data-message"
				>
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
								<DurationStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<TotalDurationStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<TimeBetweenStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<FeedingsPerDayStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<TotalFeedingsStats
									comparisonSessions={comparisonSessions}
									sessions={filteredSessions}
								/>
								<HeatMap className="col-span-2" sessions={filteredSessions} />
							</div>
							<YearlyActivityHeatMap
								className="mt-4"
								dates={sessions.map((session) => session.startTime)}
								description={
									<fbt desc="Description for the feeding yearly activity heat map chart">
										Each square shows how many feedings were logged on that day.
									</fbt>
								}
								palette="feeding"
								title={
									<fbt desc="Title for the feeding yearly activity heat map chart">
										Feeding Activity (Past Year)
									</fbt>
								}
							/>
							<div className="grid grid-cols-2 gap-4 mt-4">
								<FeedingRecords sessions={sessions} />
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
						<>
							<DiaperStats
								comparisonDiaperChanges={comparisonDiaperChanges}
								diaperChanges={filteredDiaperChanges}
							/>
							<YearlyActivityHeatMap
								className="mt-4"
								dates={diaperChanges.map((change) => change.timestamp)}
								description={
									<fbt desc="Description for the diaper yearly activity heat map chart">
										Each square shows how many diaper changes were logged on
										that day.
									</fbt>
								}
								palette="diaper"
								title={
									<fbt desc="Title for the diaper yearly activity heat map chart">
										Diaper Activity (Past Year)
									</fbt>
								}
							/>
							<div className="grid grid-cols-2 gap-4 mt-4">
								<DiaperRecords diaperChanges={diaperChanges} />
							</div>
						</>
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
						<GrowthChart measurements={[...measurements]} />
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
