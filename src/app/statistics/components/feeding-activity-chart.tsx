'use client';

import type { FeedingSession } from '@/types/feeding';
import {
	differenceInDays,
	eachDayOfInterval,
	endOfDay,
	format,
	isWithinInterval,
	startOfDay,
	subYears,
} from 'date-fns';
import { useMemo } from 'react';
import LineChart from '@/components/charts/line-chart';
import { useProfile } from '@/hooks/use-profile';

const DAYS_PER_MONTH = 30.4375;

interface FeedingActivityChartProps {
	className?: string;
	sessions: FeedingSession[];
}

export default function FeedingActivityChart({
	className,
	sessions,
}: FeedingActivityChartProps) {
	const [profile] = useProfile();
	const dob = useMemo(
		() => (profile?.dob ? startOfDay(new Date(profile.dob)) : null),
		[profile],
	);

	const data = useMemo(() => {
		const now = new Date();
		const startDate = subYears(startOfDay(now), 1);
		const endDate = endOfDay(now);

		const days = eachDayOfInterval({ end: endDate, start: startDate });

		const durationByDate = sessions.reduce<Record<string, number>>(
			(acc, session) => {
				const date = new Date(session.startTime);
				if (isWithinInterval(date, { end: endDate, start: startDate })) {
					const key = format(date, 'yyyy-MM-dd');
					acc[key] = (acc[key] || 0) + session.durationInSeconds;
				}
				return acc;
			},
			{},
		);

		return days.map((day) => {
			const key = format(day, 'yyyy-MM-dd');
			const durationInSeconds = durationByDate[key] || 0;
			return {
				x: dob
					? differenceInDays(day, dob) / DAYS_PER_MONTH
					: day.getTime(),
				y: durationInSeconds / 60, // Minutes as float for precision
			};
		});
	}, [sessions, dob]);

	return (
		<div className={className}>
			<LineChart
				backgroundColor="rgba(99, 102, 241, 0.1)"
				borderColor="#6366f1"
				data={data}
				datasetLabel={
					<fbt desc="Dataset label for feeding duration in the chart legend">
						Duration
					</fbt>
				}
				emptyStateMessage={
					<fbt desc="Message shown when no feeding data is available for the chart">
						No feeding data available for the past year.
					</fbt>
				}
				pointRadius={0}
				title={
					<fbt desc="Chart title for feeding duration">Feeding Duration</fbt>
				}
				xAxisLabel={
					dob ? (
						<fbt desc="Label for the age axis on feeding chart">Age (months)</fbt>
					) : (
						<fbt desc="Label for the date axis on feeding chart">Date</fbt>
					)
				}
				xAxisType={dob ? 'linear' : 'time'}
				yAxisLabel={
					<fbt desc="Label for the Y-axis showing feeding duration in minutes">
						Duration (min)
					</fbt>
				}
				yAxisUnit="min"
			/>
		</div>
	);
}
