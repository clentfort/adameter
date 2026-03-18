'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { useMemo } from 'react';
import PieChart from '@/components/charts/pie-chart';

interface DiaperBrandStatsProps {
	className?: string;
	diaperChanges: DiaperChange[];
	noCard?: boolean;
	products: DiaperProduct[];
}

export default function DiaperBrandStats({
	className,
	diaperChanges = [],
	products = [],
}: DiaperBrandStatsProps) {
	const productById = useMemo(
		() => new Map(products.map((p) => [p.id, p])),
		[products],
	);

	const { brandData, totalChanges } = useMemo(() => {
		const counts: Record<
			string,
			{ color: string; count: number; name: string }
		> = {};
		let total = 0;

		diaperChanges.forEach((change) => {
			if (!change.diaperProductId) return;
			const product = productById.get(change.diaperProductId);
			if (!product) return;

			total++;
			if (!counts[product.id]) {
				counts[product.id] = {
					color: product.color || '#94a3b8',
					count: 0,
					name: product.name,
				};
			}
			counts[product.id].count++;
		});

		const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
		return { brandData: sorted, totalChanges: total };
	}, [diaperChanges, productById]);

	const pieData = useMemo(
		() => ({
			datasets: [
				{
					backgroundColor: brandData.map((d) => d.color),
					data: brandData.map((d) => d.count),
					label: 'Diaper Brands',
				},
			],
			labels: brandData.map(
				(d) =>
					`${d.name}: ${d.count} (${Math.round((d.count / totalChanges) * 100)}%)`,
			),
		}),
		[brandData, totalChanges],
	);

	if (totalChanges === 0) return null;

	return (
		<div className={className}>
			<div className="h-64">
				<PieChart
					datasets={pieData.datasets}
					emptyStateMessage={
						<fbt desc="Empty state message for diaper brand chart">
							No brand data
						</fbt>
					}
					labels={pieData.labels}
				/>
			</div>
		</div>
	);
}
