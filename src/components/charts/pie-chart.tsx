'use client';

import type { Chart as ChartJS, TooltipItem } from 'chart.js';
import Chart from 'chart.js/auto';
import { useEffect, useRef, useState } from 'react';
import { useIdleCallback } from '@/hooks/use-idle-callback';

interface PieDataset {
	backgroundColor: (string | CanvasPattern)[];
	data: number[];
	label: string;
}

interface PieChartProps {
	datasets: PieDataset[];
	emptyStateMessage: React.ReactNode;
	hideLegend?: boolean;
	labels: string[];
	title?: React.ReactNode;
	tooltipLabelFormatter?: (context: TooltipItem<'pie'>) => string;
}

export default function PieChart({
	datasets,
	emptyStateMessage,
	hideLegend = false,
	labels,
	title,
	tooltipLabelFormatter,
}: PieChartProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<ChartJS<'pie', number[]> | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	useIdleCallback(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!chartRef.current || !isMounted) return;

		if (datasets.length === 0 || labels.length === 0) {
			return;
		}

		if (chartInstance.current) {
			return;
		}

		const ctx = chartRef.current.getContext('2d');
		if (!ctx) return;

		const isDark =
			typeof window !== 'undefined' &&
			document.documentElement.classList.contains('dark');
		const foregroundColor = isDark ? '#f4f4f5' : '#18181b';

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
						display: !hideLegend,
						labels: {
							color: foregroundColor,
							pointStyle: 'circle',
							usePointStyle: true,
						},
						position: 'right',
					},
					title: {
						color: foregroundColor,
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

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
				chartInstance.current = null;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMounted]);

	useEffect(() => {
		if (chartInstance.current) {
			chartInstance.current.data.labels = labels;
			chartInstance.current.data.datasets = datasets.map((ds) => ({
				...ds,
				borderWidth: 1,
			}));

			if (chartInstance.current.options.plugins?.title) {
				chartInstance.current.options.plugins.title.display = !!title;
				chartInstance.current.options.plugins.title.text =
					title?.toString() || '';
			}

			if (chartInstance.current.options.plugins?.legend) {
				chartInstance.current.options.plugins.legend.display = !hideLegend;
			}

			chartInstance.current.update();
		}
	}, [datasets, labels, title, hideLegend]);

	if (datasets.length === 0 || labels.length === 0) {
		return (
			<div className="text-muted-foreground text-center py-8">
				{emptyStateMessage}
			</div>
		);
	}

	return (
		<div className="h-[250px] w-full">
			<canvas ref={chartRef} role="graphics-document" />
		</div>
	);
}

export type { PieChartProps, PieDataset };
