'use client';

import type { DiaperProduct, DiaperChange } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import { eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import BarChart from '@/components/charts/bar-chart';
import { useShowComparisonCharts } from '@/hooks/use-show-comparison-charts';

interface DiaperCostChartProps {
	className?: string;
	diaperChanges: DiaperChange[];
	primaryRange: DateRange;
	products: DiaperProduct[];
	secondaryRange?: DateRange;
}

export default function DiaperCostChart({
	className,
	diaperChanges,
	primaryRange,
	products,
	secondaryRange,
}: DiaperCostChartProps) {
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

		const labels = primaryDays.map((day) => format(day, 'MMM d'));

		const productById = new Map(products.map((p) => [p.id, p]));

		// Create a dataset for each product
		const productData = products.map((product) => {
			const data = primaryDays.map((day) => {
				const dayStart = day;
				const dayEnd = new Date(day);
				dayEnd.setHours(23, 59, 59, 999);

				return diaperChanges
					.filter(
						(c) =>
							c.diaperProductId === product.id &&
							isWithinInterval(new Date(c.timestamp), {
								end: dayEnd,
								start: dayStart,
							}),
					)
					.reduce((acc) => acc + (product.costPerDiaper || 0), 0);
			});

			return {
				backgroundColor: product.color || '#6366f1',
				data,
				label: product.name,
				stack: 'primary',
			};
		});

		const datasets = [...productData];

		if (secondaryRange && showComparisonCharts) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});

			const secondaryData = secondaryDays.map((day) => {
				const dayStart = day;
				const dayEnd = new Date(day);
				dayEnd.setHours(23, 59, 59, 999);

				return -diaperChanges
					.filter((c) =>
						isWithinInterval(new Date(c.timestamp), {
							end: dayEnd,
							start: dayStart,
						}),
					)
					.reduce((acc, c) => {
						const product = c.diaperProductId
							? productById.get(c.diaperProductId)
							: null;
						return acc + (product?.costPerDiaper || 0);
					}, 0);
			});

			datasets.push({
				backgroundColor: '#94a3b8', // slate-400
				data: secondaryData,
				label: fbt('Cost (Prev)', 'Label for comparison diaper cost').toString(),
				stack: 'comparison',
			});
		}

		return { datasets, labels };
	}, [
		diaperChanges,
		primaryRange,
		products,
		secondaryRange,
		showComparisonCharts,
	]);

	return (
		<div className={className}>
			<BarChart
				absYLabels={true}
				datasets={datasets}
				emptyStateMessage={fbt(
					'No cost data available for the selected range.',
					'Empty state message for diaper cost chart',
				)}
				grouped={false}
				labels={labels}
				title={fbt('Diaper Costs', 'Title for diaper cost chart')}
				tooltipLabelFormatter={(context) => {
					let label = context.dataset.label || '';
					if (label) {
						label += ': ';
					}
					if (context.parsed.y !== null) {
						label += Math.abs(context.parsed.y).toFixed(2);
					}
					return label;
				}}
				xAxisLabel={fbt('Date', 'X-axis label for charts')}
				yAxisLabel={fbt('Cost', 'Y-axis label for costs')}
				yAxisUnit=""
			/>
		</div>
	);
}
