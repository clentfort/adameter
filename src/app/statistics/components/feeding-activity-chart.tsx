'use client';

import type { FeedingSession } from '@/types/feeding';
import {
	addMonths,
	differenceInDays,
	eachDayOfInterval,
	endOfDay,
	format,
	isAfter,
	isBefore,
	isWithinInterval,
	startOfDay,
	subYears,
} from 'date-fns';
import { useMemo } from 'react';
import LineChart from '@/components/charts/line-chart';
import { useProfile } from '@/hooks/use-profile';
import { useTeethSnapshot } from '@/hooks/use-teething';

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
	const teeth = useTeethSnapshot();

	const dob = useMemo(
		() => (profile?.dob ? startOfDay(new Date(profile.dob)) : null),
		[profile],
	);

	const { data, endDate, startDate } = useMemo(() => {
		const now = new Date();
		const end = endOfDay(now);
		const start = dob ? startOfDay(dob) : subYears(startOfDay(now), 1);

		const days = eachDayOfInterval({ end, start });

		const durationByDate = sessions.reduce<Record<string, number>>(
			(acc, session) => {
				const date = new Date(session.startTime);
				if (isWithinInterval(date, { end, start })) {
					const key = format(date, 'yyyy-MM-dd');
					acc[key] = (acc[key] || 0) + session.durationInSeconds;
				}
				return acc;
			},
			{},
		);

		const points = days.map((day) => {
			const key = format(day, 'yyyy-MM-dd');
			const durationInSeconds = durationByDate[key] || 0;
			return {
				x: dob ? differenceInDays(day, dob) / DAYS_PER_MONTH : day.getTime(),
				y: durationInSeconds / 3600, // Hours as float for precision
			};
		});

		return { data: points, endDate: end, startDate: start };
	}, [sessions, dob]);

	const verticalLines = useMemo(() => {
		if (!dob) return [];

		return teeth
			.filter((tooth) => tooth.date)
			.map((tooth) => {
				const date = new Date(tooth.date!);
				if (isBefore(date, startDate) || isAfter(date, endDate)) return null;

				return {
					label: '🦷',
					x: differenceInDays(date, dob) / DAYS_PER_MONTH,
				};
			})
			.filter(Boolean) as { color?: string; label?: string; x: number }[];
	}, [teeth, dob, startDate, endDate]);

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
				verticalLines={verticalLines}
				xAxisLabel={
					dob ? (
						<fbt desc="Label for the age axis on feeding chart">
							Age (months)
						</fbt>
					) : (
						<fbt desc="Label for the date axis on feeding chart">Date</fbt>
					)
				}
				xAxisTickCallback={
					dob
						? (value) => {
								const monthDate = addMonths(dob, Math.round(Number(value)));
								return format(monthDate, 'MMM');
							}
						: undefined
				}
				xAxisType={dob ? 'linear' : 'time'}
				xMax={dob ? differenceInDays(endDate, dob) / DAYS_PER_MONTH : undefined}
				xMin={dob ? 0 : undefined}
				yAxisLabel={
					<fbt desc="Label for the Y-axis showing feeding duration in hours">
						Duration (h)
					</fbt>
				}
				yAxisUnit="h"
				yMin={0}
			/>
		</div>
	);
}
