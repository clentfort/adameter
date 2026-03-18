'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import BarChart from '@/components/charts/bar-chart';
import { useCurrency } from '@/hooks/use-currency';
import { useShowComparisonCharts } from '@/hooks/use-show-comparison-charts';

interface DiaperCostChartProps {
	className?: string;
	diaperChanges: DiaperChange[];
	primaryRange: { from: Date; to: Date };
	products: DiaperProduct[];
	secondaryRange?: { from: Date; to: Date };
}

export default function DiaperCostChart({
	className,
	diaperChanges,
	primaryRange,
	products,
	secondaryRange,
}: DiaperCostChartProps) {
	const [currency] = useCurrency();
	const [showComparisonCharts] = useShowComparisonCharts();

	const productById = useMemo(
		() => new Map(products.map((p) => [p.id, p])),
		[products],
	);

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
		const dayKeys = primaryDays.map((day) => format(day, 'yyyy-MM-dd'));

		// Map of productId -> Array of daily costs
		const primaryDataByProduct = new Map<string, number[]>();

		diaperChanges.forEach((change) => {
			if (!change.diaperProductId) return;
			const product = productById.get(change.diaperProductId);
			if (!product || !product.costPerDiaper) return;

			const date = new Date(change.timestamp);
			if (
				isWithinInterval(date, {
					end: primaryRange.to,
					start: effectivePrimaryFrom,
				})
			) {
				const dayKey = format(date, 'yyyy-MM-dd');
				const dayIndex = dayKeys.indexOf(dayKey);
				if (dayIndex === -1) return;

				if (!primaryDataByProduct.has(product.id)) {
					primaryDataByProduct.set(
						product.id,
						new Array(primaryDays.length).fill(0),
					);
				}
				const costs = primaryDataByProduct.get(product.id)!;
				costs[dayIndex] += product.costPerDiaper;
			}
		});

		const datasets = [];

		// Primary datasets (one per product)
		primaryDataByProduct.forEach((data, productId) => {
			const product = productById.get(productId)!;
			datasets.push({
				backgroundColor: product.color || '#10b981',
				data,
				label: product.name,
				stack: 'primary',
			});
		});

		// Secondary/Comparison (Simplified to total cost for comparison to keep it readable)
		if (secondaryRange && showComparisonCharts) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});

			const secondaryCostByDate = diaperChanges.reduce<Record<string, number>>(
				(acc, change) => {
					if (!change.diaperProductId) return acc;
					const product = productById.get(change.diaperProductId);
					if (!product || !product.costPerDiaper) return acc;

					const date = new Date(change.timestamp);
					if (
						isWithinInterval(date, {
							end: secondaryRange.to,
							start: secondaryRange.from,
						})
					) {
						const key = format(date, 'yyyy-MM-dd');
						acc[key] = (acc[key] || 0) + product.costPerDiaper;
					}
					return acc;
				},
				{},
			);

			const secondaryData = secondaryDays.map(
				(day) => -(secondaryCostByDate[format(day, 'yyyy-MM-dd')] || 0),
			);

			datasets.push({
				backgroundColor: '#94a3b8', // slate-400
				data: secondaryData,
				label: fbt(
					'Daily Cost (Prev)',
					'Label for comparison daily cost in chart',
				),
				stack: 'comparison',
			});
		}

		return { datasets, labels };
	}, [
		diaperChanges,
		primaryRange,
		secondaryRange,
		productById,
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
				title={fbt('Diaper Cost by Product', 'Title for diaper cost chart')}
				tooltipLabelFormatter={(context) => {
					let label = context.dataset.label || '';
					if (label) {
						label += ': ';
					}
					if (context.parsed.y !== null) {
						label += `${currency}${Math.abs(context.parsed.y).toFixed(2)}`;
					}
					return label;
				}}
				xAxisLabel="Date"
				yAxisLabel={fbt(
					'Cost (' + fbt.param('currency', currency) + ')',
					'Y-axis label for diaper cost chart',
				)}
				yAxisUnit=""
			/>
		</div>
	);
}
