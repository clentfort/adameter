'use client';

import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { useMemo } from 'react';
import PieChart from '@/components/charts/pie-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DiaperBrandStatsProps {
	diaperChanges: DiaperChange[];
	products: DiaperProduct[];
}

export default function DiaperBrandStats({
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
			labels: brandData.map((d) => d.name),
		}),
		[brandData],
	);

	if (totalChanges === 0) return null;

	return (
		<Card className="w-full col-span-2">
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="Title for diaper brands statistics card">
						Diaper Brands
					</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<div className="flex flex-col sm:flex-row items-center gap-8">
					<div className="w-full sm:w-1/2 h-48 shrink-0">
						<PieChart
							datasets={pieData.datasets}
							emptyStateMessage={
								<fbt desc="Empty state message for diaper brand chart">
									No brand data
								</fbt>
							}
							hideLegend={true}
							labels={pieData.labels}
						/>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 w-full">
						{brandData.map((data) => (
							<div
								className="flex items-center justify-between border-b border-border/40 py-1"
								key={data.name}
							>
								<div className="flex items-center gap-2">
									<div
										className="w-3 h-3 rounded-full"
										style={{ backgroundColor: data.color }}
									/>
									<span className="text-sm font-medium truncate max-w-[120px]">
										{data.name}
									</span>
								</div>
								<span className="text-sm text-muted-foreground">
									{data.count} ({Math.round((data.count / totalChanges) * 100)}
									%)
								</span>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
