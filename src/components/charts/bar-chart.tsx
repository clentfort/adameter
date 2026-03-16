'use client';

import type { Chart as ChartJS, TooltipItem } from 'chart.js';
import Chart from 'chart.js/auto';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'chartjs-adapter-date-fns';
import { useIdleCallback } from '@/hooks/use-idle-callback';

interface BarDataset {
	backgroundColor: string;
	data: number[];
	label: string;
	stack?: string;
}

interface BarChartProps {
	absYLabels?: boolean;
	datasets: BarDataset[];
	emptyStateMessage: React.ReactNode;
	grouped?: boolean;
	labels: string[];
	title: React.ReactNode;
	tooltipLabelFormatter?: (context: TooltipItem<'bar'>) => string;
	tooltipTitleFormatter?: (context: TooltipItem<'bar'>[]) => string;
	verticalLines?: { color?: string; label?: string; x: number }[];
	xAxisLabel: React.ReactNode;
	yAxisLabel: React.ReactNode;
	yAxisUnit?: string;
	yMax?: number;
	yMin?: number;
}

export default function BarChart({
	absYLabels = false,
	datasets,
	emptyStateMessage,
	grouped = true,
	labels,
	title,
	tooltipLabelFormatter,
	tooltipTitleFormatter,
	verticalLines = [],
	xAxisLabel,
	yAxisLabel,
	yAxisUnit = '',
	yMax,
	yMin,
}: BarChartProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<ChartJS<'bar', number[]> | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	useIdleCallback(() => {
		setIsMounted(true);
	}, []);

	const createChart = useCallback(() => {
		if (!chartRef.current || !isMounted) return;

		if (datasets.length === 0 || labels.length === 0) {
			return;
		}

		if (chartInstance.current) {
			const chart = chartInstance.current;
			chart.data.labels = labels;
			chart.data.datasets = datasets.map((ds) => ({
				...ds,
				borderRadius: 4,
				categoryPercentage: grouped ? 0.8 : 1.0,
				grouped,
			}));

			// Update options that might have changed
			if (chart.options.plugins?.title) {
				chart.options.plugins.title.text = title?.toString() || '';
			}
			if (chart.options.scales?.y) {
				chart.options.scales.y.max = yMax;
				chart.options.scales.y.min = yMin;
			}

			chart.update();
			return;
		}

		const ctx = chartRef.current.getContext('2d');
		if (!ctx) return;

		const isDark =
			typeof window !== 'undefined' &&
			document.documentElement.classList.contains('dark');

		const verticalLinesPlugin = {
			beforeDatasetsDraw: (chart: ChartJS) => {
				if (verticalLines.length === 0) return;

				const {
					ctx,
					scales: { x, y },
				} = chart;
				ctx.save();

				verticalLines.forEach((line) => {
					const xPos = x.getPixelForValue(line.x);
					if (xPos < x.left || xPos > x.right) return;

					ctx.beginPath();
					ctx.strokeStyle =
						line.color ||
						(isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)');
					ctx.lineWidth = 1;
					ctx.setLineDash([5, 5]);
					ctx.moveTo(xPos, y.top);
					ctx.lineTo(xPos, y.bottom);
					ctx.stroke();

					if (line.label) {
						ctx.fillStyle =
							line.color ||
							(isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)');
						ctx.font = '12px sans-serif';
						ctx.textAlign = 'center';
						ctx.fillText(line.label, xPos, y.top + 15);
					}
				});

				ctx.restore();
			},
			id: 'verticalLines',
		};

		chartInstance.current = new Chart<'bar', number[]>(ctx, {
			data: {
				datasets: datasets.map((ds) => ({
					...ds,
					borderRadius: 4,
					categoryPercentage: grouped ? 0.8 : 1.0,
					grouped,
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
										let label = context.dataset.label || '';
										if (label) {
											label += ': ';
										}
										if (context.parsed.y !== null) {
											label += `${context.parsed.y.toFixed(1)}${yAxisUnit ? ` ${yAxisUnit}` : ''}`;
										}
										return label;
									},
							title: tooltipTitleFormatter
								? tooltipTitleFormatter
								: (context) => {
										return context[0].label;
									},
						},
					},
				},
				responsive: true,
				scales: {
					x: {
						grid: {
							display: false,
						},
						stacked: true,
						title: {
							display: !!xAxisLabel,
							text: xAxisLabel?.toString() || '',
						},
					},
					y: {
						beginAtZero: true,
						max: yMax,
						min: yMin,
						stacked: true,
						ticks: {
							callback: (value) => {
								const val = absYLabels ? Math.abs(Number(value)) : value;
								return yAxisUnit ? `${val}${yAxisUnit}` : val;
							},
						},
						title: {
							display: !!yAxisLabel,
							text: yAxisLabel?.toString() || '',
						},
					},
				},
			},
			plugins: [verticalLinesPlugin],
			type: 'bar',
		});
	}, [
		datasets,
		labels,
		xAxisLabel,
		yAxisLabel,
		yAxisUnit,
		yMax,
		yMin,
		absYLabels,
		tooltipTitleFormatter,
		tooltipLabelFormatter,
		title,
		verticalLines,
		grouped,
		isMounted,
	]);

	useEffect(() => {
		if (isMounted) {
			createChart();
		}

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
				chartInstance.current = null;
			}
		};
	}, [createChart, isMounted]);

	if (!isMounted || datasets.length === 0 || labels.length === 0) {
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

export type { BarChartProps, BarDataset };
