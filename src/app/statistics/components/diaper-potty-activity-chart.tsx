'use client';

import type { DiaperChange } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import { eachDayOfInterval, format } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import { bucketByDay } from '@/app/statistics/utils/bucket-by-day';
import { resolveChartStartDate } from '@/app/statistics/utils/resolve-chart-start-date';
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
		const effectivePrimaryFrom = resolveChartStartDate(
			primaryRange.from,
			diaperChanges,
			(c) => c.timestamp,
		);

		const primaryDays = eachDayOfInterval({
			end: primaryRange.to,
			start: effectivePrimaryFrom,
		});

		const primaryBuckets = bucketByDay(
			diaperChanges,
			primaryDays,
			(c) => c.timestamp,
			() => ({
				diaperStool: 0,
				diaperUrine: 0,
				pottyStool: 0,
				pottyUrine: 0,
			}),
			(acc, change) => {
				if (change.containsUrine) acc.diaperUrine++;
				if (change.containsStool) acc.diaperStool++;
				if (change.pottyUrine) acc.pottyUrine++;
				if (change.pottyStool) acc.pottyStool++;
			},
		);

		const primaryDiaperUrineData = primaryBuckets.map((b) => b.diaperUrine);
		const primaryDiaperStoolData = primaryBuckets.map((b) => b.diaperStool);
		const primaryPottyUrineData = primaryBuckets.map((b) => b.pottyUrine);
		const primaryPottyStoolData = primaryBuckets.map((b) => b.pottyStool);

		const labels = primaryDays.map((day) => format(day, 'MMM d'));

		const datasets = [];

		const isDark =
			typeof window !== 'undefined' &&
			document.documentElement.classList.contains('dark');
		const segmentBorderColor = isDark ? '#f4f4f5' : '#18181b';

		if (secondaryRange && showComparisonCharts) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});

			const secondaryBuckets = bucketByDay(
				diaperChanges,
				secondaryDays,
				(c) => c.timestamp,
				() => ({ diaper: 0, potty: 0 }),
				(acc, change) => {
					if (change.containsUrine || change.containsStool) acc.diaper++;
					if (change.pottyUrine || change.pottyStool) acc.potty++;
				},
			);

			const secondaryDiaperData = secondaryBuckets.map((b) => -b.diaper);
			const secondaryPottyData = secondaryBuckets.map((b) => -b.potty);

			datasets.push(
				{
					backgroundColor: '#94a3b8', // slate-400
					borderColor: segmentBorderColor,
					borderWidth: 1,
					data: secondaryDiaperData,
					label: fbt('Diaper (Prev)', 'Label for comparison diaper count'),
					stack: 'comparison',
				},
				{
					backgroundColor: '#cbd5e1', // slate-300
					borderColor: segmentBorderColor,
					borderWidth: 1,
					data: secondaryPottyData,
					label: fbt('Potty (Prev)', 'Label for comparison potty count'),
					stack: 'comparison',
				},
			);
		}

		datasets.push(
			{
				backgroundColor: COLORS.urine,
				borderColor: segmentBorderColor,
				borderWidth: 1,
				data: primaryDiaperUrineData,
				label: fbt('Diaper Pee', 'Label for diaper urine count in chart'),
				stack: 'primary',
			},
			{
				backgroundColor: COLORS.urine,
				borderColor: segmentBorderColor,
				borderWidth: 1,
				data: primaryPottyUrineData,
				label: fbt('Potty Pee', 'Label for potty urine count in chart'),
				stack: 'primary',
			},
			{
				backgroundColor: COLORS.stool,
				borderColor: segmentBorderColor,
				borderWidth: 1,
				data: primaryDiaperStoolData,
				label: fbt('Diaper Poo', 'Label for diaper stool count in chart'),
				stack: 'primary',
			},
			{
				backgroundColor: COLORS.stool,
				borderColor: segmentBorderColor,
				borderWidth: 1,
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
