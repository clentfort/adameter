'use client';

import type { DiaperChange } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import { eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { useMemo } from 'react';
import BarChart from '@/components/charts/bar-chart';

interface DiaperActivityChartProps {
	className?: string;
	diaperChanges: DiaperChange[];
	primaryRange: DateRange;
	secondaryRange?: DateRange;
}

export default function DiaperActivityChart({
	className,
	diaperChanges,
	primaryRange,
	secondaryRange,
}: DiaperActivityChartProps) {
	const { datasets, labels } = useMemo(() => {
		let effectivePrimaryFrom = primaryRange.from;
		if (primaryRange.from.getTime() === 0) {
			if (diaperChanges.length > 0) {
				const firstTime = diaperChanges.reduce((min, c) => {
					const t = new Date(c.timestamp).getTime();
					return t < min ? t : min;
				}, new Date(diaperChanges[0].timestamp).getTime());
				effectivePrimaryFrom = new Date(firstTime);
			} else {
				effectivePrimaryFrom = new Date();
				effectivePrimaryFrom.setDate(effectivePrimaryFrom.getDate() - 30);
			}
		}

		const primaryDays = eachDayOfInterval({
			end: primaryRange.to,
			start: effectivePrimaryFrom,
		});

		const primaryDataByDate = diaperChanges.reduce<Record<string, number>>(
			(acc, change) => {
				const date = new Date(change.timestamp);
				if (
					isWithinInterval(date, {
						end: primaryRange.to,
						start: effectivePrimaryFrom,
					})
				) {
					const key = format(date, 'yyyy-MM-dd');
					acc[key] = (acc[key] || 0) + 1;
				}
				return acc;
			},
			{},
		);

		const primaryData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')] || 0,
		);
		const labels = primaryDays.map((day) => format(day, 'MMM d'));

		const datasets = [
			{
				backgroundColor: '#eab308', // yellow-500
				data: primaryData,
				label: 'Diaper Changes',
			},
		];

		if (secondaryRange) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});

			const secondaryDataByDate = diaperChanges.reduce<Record<string, number>>(
				(acc, change) => {
					const date = new Date(change.timestamp);
					if (
						isWithinInterval(date, {
							end: secondaryRange.to,
							start: secondaryRange.from,
						})
					) {
						const key = format(date, 'yyyy-MM-dd');
						acc[key] = (acc[key] || 0) + 1;
					}
					return acc;
				},
				{},
			);

			const secondaryData = secondaryDays.map(
				(day) => secondaryDataByDate[format(day, 'yyyy-MM-dd')] || 0,
			);

			datasets.push({
				backgroundColor: 'rgba(148, 163, 184, 0.4)', // slate-400
				data: secondaryData,
				label: 'Diaper Changes (Prev)',
			});
		}

		return { datasets, labels };
	}, [diaperChanges, primaryRange, secondaryRange]);

	return (
		<div className={className}>
			<BarChart
				datasets={datasets}
				emptyStateMessage="No diaper data available for the selected range."
				grouped={false}
				labels={labels}
				title="Diaper Changes"
				xAxisLabel="Date"
				yAxisLabel="Count"
				yMin={0}
			/>
		</div>
	);
}
