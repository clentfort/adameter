'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import type { DateRange } from '@/utils/get-range-dates';
import { eachDayOfInterval, format } from 'date-fns';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import BarChart from '@/components/charts/bar-chart';
import { useLanguage } from '@/contexts/i18n-context';
import { useCurrency } from '@/hooks/use-currency';
import { useShowComparisonCharts } from '@/hooks/use-show-comparison-charts';

interface DiaperCostChartProps {
	className?: string;
	diaperChanges: DiaperChange[];
	height?: number | string;
	primaryRange: DateRange;
	products: DiaperProduct[];
	secondaryRange?: DateRange;
}

export default function DiaperCostChart({
	className,
	diaperChanges,
	height,
	primaryRange,
	products,
	secondaryRange,
}: DiaperCostChartProps) {
	const [showComparisonCharts] = useShowComparisonCharts();
	const [currency] = useCurrency();
	const { locale } = useLanguage();

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

		// Pre-calculate daily costs per product to keep it O(N)
		const dailyProductCosts = new Map<string, Map<string, number>>();
		for (const product of products) {
			dailyProductCosts.set(product.id, new Map());
		}

		for (const change of diaperChanges) {
			const productId = change.diaperProductId;
			if (!productId) continue;

			const product = productById.get(productId);
			if (!product || !product.costPerDiaper) continue;

			const dateKey = format(new Date(change.timestamp), 'yyyy-MM-dd');
			const productMap = dailyProductCosts.get(productId);
			if (productMap) {
				const current = productMap.get(dateKey) || 0;
				productMap.set(dateKey, current + product.costPerDiaper);
			}
		}

		// Create a dataset for each product
		const productData = products.map((product) => {
			const data = primaryDays.map((day) => {
				const dateKey = format(day, 'yyyy-MM-dd');
				return dailyProductCosts.get(product.id)?.get(dateKey) || 0;
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
				const dateKey = format(day, 'yyyy-MM-dd');
				let total = 0;
				for (const product of products) {
					total += dailyProductCosts.get(product.id)?.get(dateKey) || 0;
				}
				return -total;
			});

			datasets.push({
				backgroundColor: '#94a3b8', // slate-400
				data: secondaryData,
				label: fbt(
					'Cost (Prev)',
					'Label for comparison diaper cost',
				).toString(),
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
				height={height}
				labels={labels}
				title={fbt('Diaper Costs', 'Title for diaper cost chart')}
				tooltipLabelFormatter={(context) => {
					let label = context.dataset.label || '';
					if (label) {
						label += ': ';
					}
					if (context.parsed.y !== null) {
						const val = Math.abs(context.parsed.y);
						label += new Intl.NumberFormat(locale.replace('_', '-'), {
							currency,
							style: 'currency',
						}).format(val);
					}
					return label;
				}}
				xAxisLabel={fbt('Date', 'X-axis label for charts')}
				yAxisLabel={fbt('Cost', 'Y-axis label for costs')}
				yAxisUnit={
					new Intl.NumberFormat(locale.replace('_', '-'), {
						currency,
						style: 'currency',
					})
						.format(0)
						.replaceAll(/[\d\s,.]+/g, '') || ''
				}
			/>
		</div>
	);
}
