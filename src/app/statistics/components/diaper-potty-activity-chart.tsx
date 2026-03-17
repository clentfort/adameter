'use client';

import type { DiaperChange } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import { eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import BarChart from '@/components/charts/bar-chart';
import { useShowComparisonCharts } from '@/hooks/use-show-comparison-charts';

interface DiaperPottyActivityChartProps {
	className?: string;
	diaperChanges: DiaperChange[];
	primaryRange: DateRange;
	secondaryRange?: DateRange;
}

export default function DiaperPottyActivityChart({
	className,
	diaperChanges,
	primaryRange,
	secondaryRange,
}: DiaperPottyActivityChartProps) {
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
			Record<string, { diaper: number; potty: number }>
		>((acc, change) => {
			const date = new Date(change.timestamp);
			if (
				isWithinInterval(date, {
					end: primaryRange.to,
					start: effectivePrimaryFrom,
				})
			) {
				const key = format(date, 'yyyy-MM-dd');
				if (!acc[key]) acc[key] = { diaper: 0, potty: 0 };
				if (change.containsUrine || change.containsStool) acc[key].diaper++;
				if (change.pottyUrine || change.pottyStool) acc[key].potty++;
			}
			return acc;
		}, {});

		const primaryDiaperData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')]?.diaper || 0,
		);
		const primaryPottyData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')]?.potty || 0,
		);

		const labels = primaryDays.map((day) => format(day, 'MMM d'));

		const datasets = [];

		if (secondaryRange && showComparisonCharts) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});

			const secondaryDataByDate = diaperChanges.reduce<
				Record<string, { diaper: number; potty: number }>
			>((acc, change) => {
				const date = new Date(change.timestamp);
				if (
					isWithinInterval(date, {
						end: secondaryRange.to,
						start: secondaryRange.from,
					})
				) {
					const key = format(date, 'yyyy-MM-dd');
					if (!acc[key]) acc[key] = { diaper: 0, potty: 0 };
					if (change.containsUrine || change.containsStool) acc[key].diaper++;
					if (change.pottyUrine || change.pottyStool) acc[key].potty++;
				}
				return acc;
			}, {});

			const secondaryDiaperData = secondaryDays.map(
				(day) => -(secondaryDataByDate[format(day, 'yyyy-MM-dd')]?.diaper || 0),
			);
			const secondaryPottyData = secondaryDays.map(
				(day) => -(secondaryDataByDate[format(day, 'yyyy-MM-dd')]?.potty || 0),
			);

			datasets.push(
				{
					backgroundColor: '#94a3b8', // slate-400
					data: secondaryDiaperData,
					label: 'Diaper (Prev)',
					stack: 'comparison',
				},
				{
					backgroundColor: '#cbd5e1', // slate-300
					data: secondaryPottyData,
					label: 'Potty (Prev)',
					stack: 'comparison',
				},
			);
		}

		datasets.push(
			{
				backgroundColor: '#3b82f6', // blue-500
				data: primaryDiaperData,
				label: 'Diaper',
				stack: 'primary',
			},
			{
				backgroundColor: '#10b981', // emerald-500
				data: primaryPottyData,
				label: 'Potty',
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
				emptyStateMessage={fbt(
					'No data available for the selected range.',
					'Empty state message for diaper and potty activity chart',
				)}
				grouped={false}
				labels={labels}
				title={fbt(
					'Diaper & Potty Activity',
					'Title for diaper and potty activity chart',
				)}
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
