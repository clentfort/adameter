'use client';

import type { FeedingSession } from '@/types/feeding';
import type { DateRange } from '@/utils/get-range-dates';
import {
	differenceInDays,
	eachDayOfInterval,
	format,
	isAfter,
	isBefore,
} from 'date-fns';
import { useMemo } from 'react';
import { bucketByDay } from '@/app/statistics/utils/bucket-by-day';
import { resolveChartStartDate } from '@/app/statistics/utils/resolve-chart-start-date';
import BarChart from '@/components/charts/bar-chart';
import { useProfile } from '@/hooks/use-profile';
import { useShowComparisonCharts } from '@/hooks/use-show-comparison-charts';
import { useTeethSnapshot } from '@/hooks/use-teething';

interface FeedingActivityChartProps {
	className?: string;
	primaryRange: DateRange;
	secondaryRange?: DateRange;
	sessions: FeedingSession[];
}

export default function FeedingActivityChart({
	className,
	primaryRange,
	secondaryRange,
	sessions,
}: FeedingActivityChartProps) {
	const [profile] = useProfile();
	const teeth = useTeethSnapshot();
	const [showComparisonCharts] = useShowComparisonCharts();

	const { datasets, effectivePrimaryFrom, labels } = useMemo(() => {
		const effectivePrimaryFrom = resolveChartStartDate(
			primaryRange.from,
			sessions,
			(s) => s.startTime,
		);

		const primaryDays = eachDayOfInterval({
			end: primaryRange.to,
			start: effectivePrimaryFrom,
		});

		const primaryBuckets = bucketByDay(
			sessions,
			primaryDays,
			(s) => s.startTime,
			() => ({ left: 0, right: 0 }),
			(acc, session) => {
				if (session.breast === 'left') {
					acc.left += session.durationInSeconds;
				} else {
					acc.right += session.durationInSeconds;
				}
			},
		);

		const primaryLeftData = primaryBuckets.map((b) => b.left / 3600);
		const primaryRightData = primaryBuckets.map((b) => b.right / 3600);

		const labels = primaryDays.map((day) => format(day, 'MMM d'));

		const datasets = [];

		if (secondaryRange && showComparisonCharts) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});

			const secondaryBuckets = bucketByDay(
				sessions,
				secondaryDays,
				(s) => s.startTime,
				() => ({ left: 0, right: 0 }),
				(acc, session) => {
					if (session.breast === 'left') {
						acc.left += session.durationInSeconds;
					} else {
						acc.right += session.durationInSeconds;
					}
				},
			);

			const secondaryLeftData = secondaryBuckets.map((b) => -b.left / 3600);
			const secondaryRightData = secondaryBuckets.map((b) => -b.right / 3600);

			datasets.push(
				{
					backgroundColor: '#94a3b8', // slate-400
					data: secondaryLeftData,
					label: (
						<fbt desc="Legend label for secondary left breast duration">
							Left Breast (Prev)
						</fbt>
					).toString(),
					stack: 'comparison',
				},
				{
					backgroundColor: '#cbd5e1', // slate-300
					data: secondaryRightData,
					label: (
						<fbt desc="Legend label for secondary right breast duration">
							Right Breast (Prev)
						</fbt>
					).toString(),
					stack: 'comparison',
				},
			);
		}

		datasets.push(
			{
				backgroundColor: '#6366f1', // Indigo-500
				data: primaryLeftData,
				label: (
					<fbt desc="Legend label for primary left breast duration">
						Left Breast
					</fbt>
				).toString(),
				stack: 'primary',
			},
			{
				backgroundColor: '#ec4899', // Pink-500
				data: primaryRightData,
				label: (
					<fbt desc="Legend label for primary right breast duration">
						Right Breast
					</fbt>
				).toString(),
				stack: 'primary',
			},
		);

		return { datasets, effectivePrimaryFrom, labels };
	}, [sessions, primaryRange, secondaryRange, showComparisonCharts]);

	const verticalLines = useMemo(() => {
		return teeth
			.filter((tooth) => tooth.date)
			.map((tooth) => {
				const date = new Date(tooth.date!);
				if (
					isBefore(date, effectivePrimaryFrom) ||
					isAfter(date, primaryRange.to)
				) {
					return null;
				}

				return {
					label: '🦷',
					x: differenceInDays(date, effectivePrimaryFrom),
				};
			})
			.filter(Boolean) as { color?: string; label?: string; x: number }[];
	}, [teeth, effectivePrimaryFrom, primaryRange.to]);

	return (
		<div className={className}>
			<BarChart
				absYLabels={true}
				datasets={datasets}
				emptyStateMessage={
					<fbt desc="Message shown when no feeding data is available for the chart">
						No feeding data available for the selected range.
					</fbt>
				}
				grouped={false}
				labels={labels}
				title={(
					<fbt desc="Chart title for feeding duration">Feeding Duration</fbt>
				).toString()}
				tooltipLabelFormatter={(context) => {
					let label = context.dataset.label || '';
					if (label) {
						label += ': ';
					}
					if (context.parsed.y !== null) {
						label += `${Math.abs(context.parsed.y).toFixed(1)} h`;
					}
					return label;
				}}
				verticalLines={verticalLines}
				xAxisLabel={(
					<fbt desc="Label for the date axis on feeding chart">Date</fbt>
				).toString()}
				yAxisLabel={(
					<fbt desc="Label for the Y-axis showing feeding duration in hours">
						Duration (h)
					</fbt>
				).toString()}
				yAxisUnit=""
			/>
		</div>
	);
}
