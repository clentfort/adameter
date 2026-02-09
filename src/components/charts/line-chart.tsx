'use client';

import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { useCallback, useEffect, useRef } from 'react';
import 'chartjs-adapter-date-fns';
import type { Event } from '@/types/event';

interface ChartDataContext {
	dataset: {
		label?: string;
	};
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
	data: PointData[];
	datasetLabel: React.ReactNode;
	emptyStateMessage: React.ReactNode;
	events?: Event[];
	title: React.ReactNode;
	tooltipLabelFormatter?: (context: ChartDataContext) => string;
	tooltipTitleFormatter?: (context: ChartDataContext[]) => string;
	xAxisLabel: React.ReactNode;
	yAxisLabel: React.ReactNode;
	yAxisUnit?: string;
}

export default function LineChart({
	backgroundColor = 'rgba(99, 102, 241, 0.1)',
	borderColor = '#6366f1',
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
			return;
		}

		if (chartInstance.current) {
			chartInstance.current.destroy();
		}

		const ctx = chartRef.current.getContext('2d');
		if (!ctx) return;

		// @ts-expect-error Type 'Chart<keyof ChartTypeRegistry, (number | Point | [number, number] | BubbleDataPoint | null)[], unknown>' is not assignable to type 'Chart<"line", PointData[], unknown>'.
		chartInstance.current = new Chart(ctx, {
			data: {
				datasets: [
					{
						backgroundColor,
						borderColor,
						data,
						label: String(datasetLabel),
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
						display: !!datasetLabel,
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
										return format(date, 'dd. MMMM yyyy');
									},
						},
					},
				},
				responsive: true,
				scales: {
					x: {
						adapters: {
							date: {},
						},
						time: {
							displayFormats: {
								day: 'dd.MM',
							},
							unit: 'day',
						},
						title: {
							display: true,
							text: String(xAxisLabel),
						},
						type: 'time',
					},
					y: {
						beginAtZero: false,
						ticks: {
							callback: (value) => {
								const roundedValue =
									typeof value === 'number'
										? Math.round(value * 100) / 100
										: value;
								return yAxisUnit && typeof yAxisUnit === 'string'
									? `${roundedValue} ${yAxisUnit}`
									: roundedValue;
							},
						},
						title: {
							display: true,
							text: String(yAxisLabel),
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
								chartCtx.font = '10px Arial';
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
			<canvas ref={chartRef} role="graphics-document" />
		</div>
	);
}

export type { LineChartProps };
