'use client';

import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { de } from 'date-fns/locale'; // TODO: Make locale configurable
import { useCallback, useEffect, useRef } from 'react';
import 'chartjs-adapter-date-fns';
import type { Event } from '@/types/event'; // Assuming Event type is available

// Define FbtFunction type for props
type FbtFunction = (text: string, description: string) => React.ReactNode;

interface ChartDataContext {
	parsed: {
		x: number;
		y: number;
	};
}

interface PointData {
	x: Date | number;
	y: number;
}

interface LineChartProps {
	backgroundColor?: string;
	borderColor?: string;
	chartId: string;
	data: PointData[];
	datasetLabel: React.ReactNode; // For <fbt>
	emptyStateMessage: React.ReactNode; // For <fbt>
	events?: Event[];
	title: React.ReactNode; // For <fbt>
	tooltipLabelFormatter?: (context: ChartDataContext) => string;
	tooltipTitleFormatter?: (context: ChartDataContext[]) => string;
	xAxisLabel: React.ReactNode; // For <fbt>
	yAxisLabel: React.ReactNode; // For <fbt>
	yAxisUnit?: string; // e.g., 'g', 'cm', 's'
}

export default function LineChart({
	backgroundColor = 'rgba(99, 102, 241, 0.1)',
	borderColor = '#6366f1',
	chartId,
	data,
	datasetLabel,
	emptyStateMessage,
	events = [],
	title,
	tooltipLabelFormatter,
	tooltipTitleFormatter,
	xAxisLabel,
	yAxisLabel,
	yAxisUnit = '',
}: LineChartProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<Chart | null>(null);

	const createChart = useCallback(() => {
		if (!chartRef.current) return;

		if (data.length === 0) {
			// Potentially render empty state message directly in the canvas area or handle outside
			return;
		}

		// Clean up existing chart
		if (chartInstance.current) {
			chartInstance.current.destroy();
		}

		const ctx = chartRef.current.getContext('2d');
		if (!ctx) return;

		chartInstance.current = new Chart(ctx, {
			data: {
				datasets: [
					{
						backgroundColor,
						borderColor,
						data,
						label: String(datasetLabel), // Ensure string conversion
						pointHoverRadius: 7,
						pointRadius: 5,
						tension: 0.3,
					},
				],
			},
			options: {
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: !!datasetLabel, // Only display legend if a label is provided
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
											label += `${context.parsed.y}${yAxisUnit ? ` ${yAxisUnit}` : ''}`;
										}
										return label;
									},
							title: tooltipTitleFormatter
								? tooltipTitleFormatter
								: (context) => {
										const date = new Date(context[0].parsed.x);
										return format(date, 'dd. MMMM yyyy', { locale: de });
									},
						},
					},
				},
				responsive: true,
				scales: {
					x: {
						adapters: {
							date: {
								locale: de, // TODO: Make locale configurable
							},
						},
						time: {
							displayFormats: {
								day: 'dd.MM',
							},
							unit: 'day', // TODO: Make unit configurable if not always time
						},
						title: {
							display: true,
							text: String(xAxisLabel), // Ensure string conversion
						},
						type: 'time', // TODO: Make type configurable (e.g. 'linear')
					},
					y: {
						beginAtZero: false, // TODO: Make configurable
						ticks: {
							callback:
								yAxisUnit && typeof yAxisUnit === 'string' // Ensure yAxisUnit is a string
									? (value) => `${value} ${yAxisUnit}`
									: undefined,
						},
						title: {
							display: true,
							text: String(yAxisLabel), // Ensure string conversion
						},
					},
				},
			},
			plugins: [
				{
					afterDraw: (chart) => {
						if (events.length === 0) return;
						const chartCtx = chart.ctx;
						const xAxis = chart.scales.x;
						const yAxis = chart.scales.y;

						events.forEach((event) => {
							const eventDate = new Date(event.startDate);
							const xPosition = xAxis.getPixelForValue(eventDate.getTime());

							if (xPosition >= xAxis.left && xPosition <= xAxis.right) {
								chartCtx.save();
								chartCtx.beginPath();
								chartCtx.moveTo(xPosition, yAxis.top);
								chartCtx.lineTo(xPosition, yAxis.bottom);
								chartCtx.lineWidth = 2;
								chartCtx.strokeStyle = event.color || '#6366f1';
								chartCtx.setLineDash([5, 5]);
								chartCtx.stroke();

								chartCtx.textAlign = 'center';
								chartCtx.fillStyle = event.color || '#6366f1';
								chartCtx.font = '10px Arial'; // TODO: Consider making font configurable or use theme
								chartCtx.fillText(event.title, xPosition, yAxis.top - 5);
								chartCtx.restore();
							}
						});
					},
					id: 'eventLines',
				},
			],
			type: 'line',
		});
	}, [
		data,
		events,
		backgroundColor,
		borderColor,
		datasetLabel,
		xAxisLabel,
		yAxisLabel,
		yAxisUnit,
		tooltipTitleFormatter,
		tooltipLabelFormatter,
		// Note: title is not directly used in chart.js options but is part of the component's identity
	]);

	useEffect(() => {
		createChart();

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}
		};
	}, [createChart]);

	if (data.length === 0) {
		return (
			<div className="text-muted-foreground text-center py-8">
				{emptyStateMessage}
			</div>
		);
	}

	return (
		<div className="h-[250px]">
			{' '}
			{/* TODO: Make height configurable */}
			<canvas
				id={chartId}
				ref={chartRef}
				aria-label={chartId} // Use chartId for a stable aria-label for testing
				role="graphics-document"
			/>
		</div>
	);
}

// It's good practice to also export the props type if it might be useful elsewhere
export type { LineChartProps };
