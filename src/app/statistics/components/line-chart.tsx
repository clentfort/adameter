'use client';

import type { ReactNode } from 'react';
import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { fbt } from 'fbtee';
import { useCallback, useEffect, useRef } from 'react';
import 'chartjs-adapter-date-fns';

interface ChartPoint {
	x: Date;
	y: number;
}

interface ChartDataPoint {
	x: Date;
	y: number;
}

interface LineChartProps {
	backgroundColor: string;
	borderColor: string;
	chartData: ChartDataPoint[];
	datasetLabel: string; // e.g., "Weight (g)"
	events?: Event[];
	title: ReactNode; // Chart card title
	xAxisLabel: string; // e.g., "Date"
	noDataMessageLabel: string; // e.g., "Weight"
}

export default function LineChart({
	backgroundColor,
	borderColor,
	chartData,
	datasetLabel,
	events = [],
	title,
	xAxisLabel,
	noDataMessageLabel,
}: LineChartProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<Chart | null>(null);

	const createChart = useCallback(() => {
		if (!chartRef.current) return;

		// Data is already processed, sort it just in case
		const sortedData = [...chartData].sort(
			(a, b) => a.x.getTime() - b.x.getTime(),
		);

		if (sortedData.length === 0) {
			if (chartInstance.current) {
				chartInstance.current.destroy();
				chartInstance.current = null;
			}
			return;
		}

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
						data: sortedData,
						label: datasetLabel, // Use the combined label
						pointHoverRadius: 7,
						pointRadius: 5,
						tension: 0.3,
					},
				],
			},
			options: {
				maintainAspectRatio: false,
				plugins: {
					tooltip: {
						callbacks: {
							title: (context) => {
								const date = new Date(context[0].parsed.x);
								// TODO: Use active locale from fbt
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
								// TODO: Use active locale from fbt
								locale: de,
							},
						},
						time: {
							displayFormats: {
								day: 'dd.MM',
							},
							unit: 'day',
						},
						title: {
							display: true,
							text: xAxisLabel,
						},
						type: 'time',
					},
					y: {
						beginAtZero: false,
						title: {
							display: true,
							text: datasetLabel, // Use the combined label for Y-axis
						},
					},
				},
			},
			plugins: [
				{
					afterDraw: (chart) => {
						const ctxInternal = chart.ctx;
						const xAxis = chart.scales.x;
						const yAxis = chart.scales.y;

						events.forEach((event) => {
							const eventDate = new Date(event.startDate);
							const xPosition = xAxis.getPixelForValue(eventDate.getTime());

							if (xPosition >= xAxis.left && xPosition <= xAxis.right) {
								ctxInternal.save();
								ctxInternal.beginPath();
								ctxInternal.moveTo(xPosition, yAxis.top);
								ctxInternal.lineTo(xPosition, yAxis.bottom);
								ctxInternal.lineWidth = 2;
								ctxInternal.strokeStyle = event.color || '#6366f1';
								ctxInternal.setLineDash([5, 5]);
								ctxInternal.stroke();

								ctxInternal.textAlign = 'center';
								ctxInternal.fillStyle = event.color || '#6366f1';
								ctxInternal.font = '10px Arial';
								ctxInternal.fillText(event.title, xPosition, yAxis.top - 5);
								ctxInternal.restore();
							}
						});
					},
					id: 'eventLines',
				},
			],
			type: 'line',
		});
	}, [
		chartData,
		datasetLabel,
		events,
		backgroundColor,
		borderColor,
		xAxisLabel,
	]);

	useEffect(() => {
		createChart();

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
				chartInstance.current = null;
			}
		};
	}, [createChart]);

	const hasData = chartData.length > 0;

	return (
		<div>
			<h3 className="font-medium mb-2">{title}</h3>
			<div className="h-[250px]">
				{hasData ? (
					<canvas ref={chartRef} />
				) : (
					<p className="text-muted-foreground text-center py-8">
						<fbt desc="no data available for chart">
							No{' '}
							<fbt:param name="dataType">
								{noDataMessageLabel.toLowerCase()}
							</fbt:param>{' '}
							data available.
						</fbt>
					</p>
				)}
			</div>
		</div>
	);
}
