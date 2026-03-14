'use client';

import type { Chart as ChartJS, TooltipItem } from 'chart.js';
import Chart from 'chart.js/auto';
import { useCallback, useEffect, useRef } from 'react';

interface PieDataset {
	backgroundColor: string[];
	data: number[];
	label: string;
}

interface PieChartProps {
	datasets: PieDataset[];
	emptyStateMessage: React.ReactNode;
	labels: string[];
	title?: React.ReactNode;
	tooltipLabelFormatter?: (context: TooltipItem<'pie'>) => string;
}

export default function PieChart({
	datasets,
	emptyStateMessage,
	labels,
	title,
	tooltipLabelFormatter,
}: PieChartProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<ChartJS<'pie', number[]> | null>(null);

	const createChart = useCallback(() => {
		if (!chartRef.current) return;

		if (datasets.length === 0 || labels.length === 0) {
			return;
		}

		if (chartInstance.current) {
			chartInstance.current.destroy();
		}

		const ctx = chartRef.current.getContext('2d');
		if (!ctx) return;

		chartInstance.current = new Chart<'pie', number[]>(ctx, {
			data: {
				datasets: datasets.map((ds) => ({
					...ds,
					borderWidth: 1,
				})),
				labels,
			},
			options: {
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true,
						position: 'bottom',
					},
					title: {
						display: !!title,
						text: title?.toString() || '',
					},
					tooltip: {
						callbacks: {
							label: tooltipLabelFormatter
								? tooltipLabelFormatter
								: (context) => {
										let label = context.label || '';
										if (label) {
											label += ': ';
										}
										if (context.parsed !== null) {
											label += context.parsed.toLocaleString();
										}
										return label;
									},
						},
					},
				},
				responsive: true,
			},
			type: 'pie',
		});
	}, [datasets, labels, title, tooltipLabelFormatter]);

	useEffect(() => {
		createChart();

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}
		};
	}, [createChart]);

	if (datasets.length === 0 || labels.length === 0) {
		return (
			<div className="text-muted-foreground text-center py-8">
				{emptyStateMessage}
			</div>
		);
	}

	return (
		<div className="h-[300px] w-full">
			<canvas ref={chartRef} role="graphics-document" />
		</div>
	);
}

export type { PieChartProps, PieDataset };
