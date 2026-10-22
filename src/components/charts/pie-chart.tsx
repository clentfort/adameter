'use client';

import type { Chart as ChartJS } from 'chart.js';
import Chart from 'chart.js/auto';
import { useEffect, useRef, useState } from 'react';
import { useIdleCallback } from '@/hooks/use-idle-callback';
import { getChartTheme, legendLabels } from './chart-theme';

interface PieDataset {
	backgroundColor: (string | CanvasPattern)[];
	data: number[];
	label: string;
}

interface PieChartProps {
	datasets: PieDataset[];
	emptyStateMessage: React.ReactNode;
	labels: string[];
}

export default function PieChart({
	datasets,
	emptyStateMessage,
	labels,
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

		const theme = getChartTheme();

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
						labels: legendLabels(theme),
						position: 'right',
					},
					title: {
						color: theme.foreground,
						display: false,
						text: '',
					},
					tooltip: {
						callbacks: {
							label: (context) => {
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

			chartInstance.current.update();
		}
	}, [datasets, labels]);

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
