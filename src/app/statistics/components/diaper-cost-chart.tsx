'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { useMemo } from 'react';
import BarChart from '@/components/charts/bar-chart';
import { useCurrency } from '@/hooks/use-currency';

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

	const productCostById = useMemo(
		() =>
			new Map(
				products
					.filter(
						(p) =>
							typeof p.costPerDiaper === 'number' &&
							Number.isFinite(p.costPerDiaper),
					)
					.map((p) => [p.id, p.costPerDiaper as number]),
			),
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

		const primaryCostByDate = diaperChanges.reduce<Record<string, number>>(
			(acc, change) => {
				const date = new Date(change.timestamp);
				if (
					isWithinInterval(date, {
						end: primaryRange.to,
						start: effectivePrimaryFrom,
					})
				) {
					const key = format(date, 'yyyy-MM-dd');
					const cost = change.diaperProductId
						? productCostById.get(change.diaperProductId) || 0
						: 0;
					acc[key] = (acc[key] || 0) + cost;
				}
				return acc;
			},
			{},
		);

		const primaryData = primaryDays.map(
			(day) => primaryCostByDate[format(day, 'yyyy-MM-dd')] || 0,
		);
		const labels = primaryDays.map((day) => format(day, 'MMM d'));

		const datasets = [
			{
				backgroundColor: '#10b981', // emerald-500
				data: primaryData,
				label: 'Daily Cost',
			},
		];

		if (secondaryRange) {
			const secondaryDays = eachDayOfInterval({
				end: secondaryRange.to,
				start: secondaryRange.from,
			});

			const secondaryCostByDate = diaperChanges.reduce<Record<string, number>>(
				(acc, change) => {
					const date = new Date(change.timestamp);
					if (
						isWithinInterval(date, {
							end: secondaryRange.to,
							start: secondaryRange.from,
						})
					) {
						const key = format(date, 'yyyy-MM-dd');
						const cost = change.diaperProductId
							? productCostById.get(change.diaperProductId) || 0
							: 0;
						acc[key] = (acc[key] || 0) + cost;
					}
					return acc;
				},
				{},
			);

			const secondaryData = secondaryDays.map(
				(day) => secondaryCostByDate[format(day, 'yyyy-MM-dd')] || 0,
			);

			datasets.push({
				backgroundColor: 'rgba(148, 163, 184, 0.4)', // slate-400
				data: secondaryData,
				label: 'Daily Cost (Prev)',
			});
		}

		return { datasets, labels };
	}, [diaperChanges, primaryRange, secondaryRange, productCostById]);

	return (
		<div className={className}>
			<BarChart
				datasets={datasets}
				emptyStateMessage="No cost data available for the selected range."
				grouped={false}
				labels={labels}
				title="Diaper Cost"
				xAxisLabel="Date"
				yAxisLabel={`Cost (${currency})`}
				yMin={0}
			/>
		</div>
	);
}
