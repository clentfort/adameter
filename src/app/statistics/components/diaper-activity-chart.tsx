'use client';

import type { DiaperChange } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import { eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { useMemo } from 'react';
import BarChart from '@/components/charts/bar-chart';
import { useShowComparisonCharts } from '@/hooks/use-show-comparison-charts';

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
	const [showComparisonCharts] = useShowComparisonCharts();
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
		const primaryDataByDate = diaperChanges.reduce<
			Record<string, { stool: number; urine: number }>
		>((acc, change) => {
			const date = new Date(change.timestamp);
			if (
				isWithinInterval(date, {
					end: primaryRange.to,
					start: effectivePrimaryFrom,
				})
			) {
				const key = format(date, 'yyyy-MM-dd');
				if (!acc[key]) acc[key] = { stool: 0, urine: 0 };
				if (change.containsUrine) acc[key].urine++;
				if (change.containsStool) acc[key].stool++;
			}
			return acc;
		}, {});
		const primaryUrineData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')]?.urine || 0,
		);
		const primaryStoolData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')]?.stool || 0,
		);
		const labels = primaryDays.map((day) => format(day, 'MMM d'));
		const datasets = [];
		if (secondaryRange && showComparisonCharts) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});
			const secondaryDataByDate = diaperChanges.reduce<
				Record<string, { stool: number; urine: number }>
			>((acc, change) => {
				const date = new Date(change.timestamp);
				if (
					isWithinInterval(date, {
						end: secondaryRange.to,
						start: secondaryRange.from,
					})
				) {
					const key = format(date, 'yyyy-MM-dd');
					if (!acc[key]) acc[key] = { stool: 0, urine: 0 };
					if (change.containsUrine) acc[key].urine++;
					if (change.containsStool) acc[key].stool++;
				}
				return acc;
			}, {});
			const secondaryUrineData = secondaryDays.map(
				(day) => -(secondaryDataByDate[format(day, 'yyyy-MM-dd')]?.urine || 0),
			);
			const secondaryStoolData = secondaryDays.map(
				(day) => -(secondaryDataByDate[format(day, 'yyyy-MM-dd')]?.stool || 0),
			);
			datasets.push(
				{
					backgroundColor: '#94a3b8', // slate-400
					data: secondaryUrineData,
					label: 'Urine (Prev)',
					stack: 'comparison',
				},
				{
					backgroundColor: '#cbd5e1', // slate-300
					data: secondaryStoolData,
					label: 'Stool (Prev)',
					stack: 'comparison',
				},
			);
		}
		datasets.push(
			{
				backgroundColor: '#eab308', // yellow-500
				data: primaryUrineData,
				label: 'Urine',
				stack: 'primary',
			},
			{
				backgroundColor: '#92400e', // amber-900
				data: primaryStoolData,
				label: 'Stool',
				stack: 'primary',
			},
		);
		return { datasets, labels };
	}, [diaperChanges, primaryRange, secondaryRange, showComparisonCharts]);
	return (
		<div className={className}>
			<BarChart
				absYLabels={true}
				datasets={datasets}
				emptyStateMessage="No diaper data available for the selected range."
				grouped={false}
				labels={labels}
				title="Diaper Changes"
				tooltipLabelFormatter={(context) => {
					let label = context.dataset.label || '';
					if (label) {
						label += ': ';
					}
					if (context.parsed.y !== null) {
						label += Math.abs(context.parsed.y).toString();
					}
					return label;
				}}
				xAxisLabel="Date"
				yAxisLabel="Count"
				yAxisUnit=""
			/>
		</div>
	);
}
