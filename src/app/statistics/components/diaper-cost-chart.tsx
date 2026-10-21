'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { eachDayOfInterval, format } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import { bucketByDay } from '@/app/statistics/utils/bucket-by-day';
import { resolveChartStartDate } from '@/app/statistics/utils/resolve-chart-start-date';
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
		const effectivePrimaryFrom = resolveChartStartDate(
			primaryRange.from,
			diaperChanges,
			(c) => c.timestamp,
		);

		const primaryDays = eachDayOfInterval({
			end: primaryRange.to,
			start: effectivePrimaryFrom,
		});

		const labels = primaryDays.map((day) => format(day, 'MMM d'));

		const primaryBucketsByProduct = bucketByDay(
			diaperChanges,
			primaryDays,
			(c) => c.timestamp,
			() => new Map<string, number>(),
			(accMap, change) => {
				if (!change.diaperProductId) return;
				const product = productById.get(change.diaperProductId);
				if (!product || !product.costPerDiaper) return;
				accMap.set(
					product.id,
					(accMap.get(product.id) || 0) + product.costPerDiaper,
				);
			},
		);

		// Map of productId -> Array of daily costs
		const primaryDataByProduct = new Map<string, number[]>();

		primaryBucketsByProduct.forEach((dayMap, dayIndex) => {
			dayMap.forEach((cost, productId) => {
				let data = primaryDataByProduct.get(productId);
				if (!data) {
					data = new Array(primaryDays.length).fill(0);
					primaryDataByProduct.set(productId, data);
				}
				data[dayIndex] = cost;
			});
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

			const secondaryBuckets = bucketByDay(
				diaperChanges,
				secondaryDays,
				(c) => c.timestamp,
				() => ({ cost: 0 }),
				(acc, change) => {
					if (!change.diaperProductId) return;
					const product = productById.get(change.diaperProductId);
					if (!product || !product.costPerDiaper) return;
					acc.cost += product.costPerDiaper;
				},
			);

			const secondaryData = secondaryBuckets.map((b) => -b.cost);

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
