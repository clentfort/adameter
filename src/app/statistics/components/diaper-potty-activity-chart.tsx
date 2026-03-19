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

const COLORS = {
	stool: '#92400e', // brown
	urine: '#eab308', // yellow
};

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
			Record<
				string,
				{
					diaperStool: number;
					diaperUrine: number;
					pottyStool: number;
					pottyUrine: number;
				}
			>
		>((acc, change) => {
			const date = new Date(change.timestamp);
			if (
				isWithinInterval(date, {
					end: primaryRange.to,
					start: effectivePrimaryFrom,
				})
			) {
				const key = format(date, 'yyyy-MM-dd');
				if (!acc[key])
					acc[key] = {
						diaperStool: 0,
						diaperUrine: 0,
						pottyStool: 0,
						pottyUrine: 0,
					};
				if (change.containsUrine) acc[key].diaperUrine++;
				if (change.containsStool) acc[key].diaperStool++;
				if (change.pottyUrine) acc[key].pottyUrine++;
				if (change.pottyStool) acc[key].pottyStool++;
			}
			return acc;
		}, {});

		const primaryDiaperUrineData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')]?.diaperUrine || 0,
		);
		const primaryDiaperStoolData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')]?.diaperStool || 0,
		);
		const primaryPottyUrineData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')]?.pottyUrine || 0,
		);
		const primaryPottyStoolData = primaryDays.map(
			(day) => primaryDataByDate[format(day, 'yyyy-MM-dd')]?.pottyStool || 0,
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
					label: fbt('Diaper (Prev)', 'Label for comparison diaper count'),
					stack: 'comparison',
				},
				{
					backgroundColor: '#cbd5e1', // slate-300
					data: secondaryPottyData,
					label: fbt('Potty (Prev)', 'Label for comparison potty count'),
					stack: 'comparison',
				},
			);
		}

		const isDark =
			typeof window !== 'undefined' &&
			document.documentElement.classList.contains('dark');
		const cardBg = isDark ? '#18181b' : '#ffffff';

		datasets.push(
			{
				backgroundColor: COLORS.urine,
				data: primaryDiaperUrineData,
				label: fbt('Diaper Pee', 'Label for diaper urine count in chart'),
				stack: 'primary',
			},
			{
				backgroundColor: COLORS.urine,
				borderColor: cardBg,
				borderWidth: 2,
				data: primaryPottyUrineData,
				label: fbt('Potty Pee', 'Label for potty urine count in chart'),
				stack: 'primary',
			},
			{
				backgroundColor: COLORS.stool,
				data: primaryDiaperStoolData,
				label: fbt('Diaper Poo', 'Label for diaper stool count in chart'),
				stack: 'primary',
			},
			{
				backgroundColor: COLORS.stool,
				borderColor: cardBg,
				borderWidth: 2,
				data: primaryPottyStoolData,
				label: fbt('Potty Poo', 'Label for potty stool count in chart'),
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
				xAxisLabel={fbt('Date', 'X-axis label for charts')}
				yAxisLabel={fbt('Count', 'Y-axis label for counts')}
				yAxisUnit=""
			/>
		</div>
	);
}
