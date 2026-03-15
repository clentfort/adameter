'use client';

import type { FeedingSession } from '@/types/feeding';
import type { DateRange } from '@/utils/get-range-dates';
import {
	differenceInDays,
	eachDayOfInterval,
	format,
	isAfter,
	isBefore,
	isWithinInterval,
} from 'date-fns';
import { useMemo } from 'react';
import BarChart from '@/components/charts/bar-chart';
import { useProfile } from '@/hooks/use-profile';
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

	const { datasets, effectivePrimaryFrom, labels } = useMemo(() => {
		let effectivePrimaryFrom = primaryRange.from;
		// If "All Data" (Date(0)), find the first session or default to 30 days ago
		if (primaryRange.from.getTime() === 0) {
			if (sessions.length > 0) {
				const firstSessionTime = sessions.reduce((min, s) => {
					const t = new Date(s.startTime).getTime();
					return t < min ? t : min;
				}, new Date(sessions[0].startTime).getTime());
				effectivePrimaryFrom = new Date(firstSessionTime);
			} else {
				effectivePrimaryFrom = new Date();
				effectivePrimaryFrom.setDate(effectivePrimaryFrom.getDate() - 30);
			}
		}

		const primaryDays = eachDayOfInterval({
			end: primaryRange.to,
			start: effectivePrimaryFrom,
		});

		const primaryDataByDate = sessions.reduce<
			Record<string, { bottle: number; left: number; right: number }>
		>((acc, session) => {
			const date = new Date(session.startTime);
			if (
				isWithinInterval(date, {
					end: primaryRange.to,
					start: effectivePrimaryFrom,
				})
			) {
				const key = format(date, 'yyyy-MM-dd');
				if (!acc[key]) acc[key] = { bottle: 0, left: 0, right: 0 };
				if (session.type === 'bottle') {
					acc[key].bottle += (session.amountMl || 0) / 10; // Normalized for display if duration is used elsewhere, but here we stack
				} else if (session.type === 'breast') {
					if (session.breast === 'left') {
						acc[key].left += session.durationInSeconds / 60;
					} else {
						acc[key].right += session.durationInSeconds / 60;
					}
				}
			}
			return acc;
		}, {});

		const primaryLeftData = primaryDays.map((day) => {
			const key = format(day, 'yyyy-MM-dd');
			return primaryDataByDate[key]?.left || 0;
		});

		const primaryRightData = primaryDays.map((day) => {
			const key = format(day, 'yyyy-MM-dd');
			return primaryDataByDate[key]?.right || 0;
		});

		const primaryBottleData = primaryDays.map((day) => {
			const key = format(day, 'yyyy-MM-dd');
			return primaryDataByDate[key]?.bottle || 0;
		});

		const labels = primaryDays.map((day) => format(day, 'MMM d'));

		const datasets = [
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
			{
				backgroundColor: '#3b82f6', // Blue-500
				data: primaryBottleData,
				label: (
					<fbt desc="Legend label for bottle amount">Bottle (10ml units)</fbt>
				).toString(),
				stack: 'primary',
			},
		];

		if (secondaryRange) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});

			const secondaryDurationByDate = sessions.reduce<
				Record<string, { left: number; right: number }>
			>((acc, session) => {
				const date = new Date(session.startTime);
				if (
					isWithinInterval(date, {
						end: secondaryRange.to,
						start: secondaryRange.from,
					})
				) {
					const key = format(date, 'yyyy-MM-dd');
					if (!acc[key]) acc[key] = { left: 0, right: 0 };
					if (session.breast === 'left') {
						acc[key].left += session.durationInSeconds;
					} else {
						acc[key].right += session.durationInSeconds;
					}
				}
				return acc;
			}, {});

			const secondaryLeftData = secondaryDays.map((day) => {
				const key = format(day, 'yyyy-MM-dd');
				return (secondaryDurationByDate[key]?.left || 0) / 3600;
			});

			const secondaryRightData = secondaryDays.map((day) => {
				const key = format(day, 'yyyy-MM-dd');
				return (secondaryDurationByDate[key]?.right || 0) / 3600;
			});

			datasets.push(
				{
					backgroundColor: 'rgba(148, 163, 184, 0.4)', // Slate-400 with opacity
					data: secondaryLeftData,
					label: (
						<fbt desc="Legend label for secondary left breast duration">
							Left Breast (Prev)
						</fbt>
					).toString(),
					stack: 'secondary',
				},
				{
					backgroundColor: 'rgba(203, 213, 225, 0.4)', // Slate-300 with opacity
					data: secondaryRightData,
					label: (
						<fbt desc="Legend label for secondary right breast duration">
							Right Breast (Prev)
						</fbt>
					).toString(),
					stack: 'secondary',
				},
			);
		}

		return { datasets, effectivePrimaryFrom, labels };
	}, [sessions, primaryRange, secondaryRange]);

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
				verticalLines={verticalLines}
				xAxisLabel={(
					<fbt desc="Label for the date axis on feeding chart">Date</fbt>
				).toString()}
				yAxisLabel={(
					<fbt desc="Label for the Y-axis showing feeding intensity">
						Intensity (min / 10ml)
					</fbt>
				).toString()}
				yMin={0}
			/>
		</div>
	);
}
