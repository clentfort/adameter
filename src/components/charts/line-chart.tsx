'use client';

import type { Event } from '@/types/event';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useCallback, useEffect, useRef } from 'react';
import 'chartjs-adapter-date-fns'; // Import the date-fns adapter
import { fbt } from 'fbtee';

interface LineChartProps {
	color?: string;
	data: { x: Date; y: number }[];
	events?: Event[];
	label: string;
	unit: string;
}

export default function LineChart({
	color = '#6366f1', // Default color if not provided
	data = [],
	events = [],
	label,
	unit,
}: LineChartProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<Chart | null>(null);

	const createChart = useCallback(() => {
		if (!chartRef.current) return;

		if (data.length === 0) {
			// Destroy existing chart if data becomes empty
			if (chartInstance.current) {
				chartInstance.current.destroy();
				chartInstance.current = null;
			}
			return;
		}

		// Clean up existing chart
		if (chartInstance.current) {
			chartInstance.current.destroy();
		}

		const ctx = chartRef.current.getContext('2d');
		if (!ctx) return;

		// Create new chart
		chartInstance.current = new Chart(ctx, {
			data: {
				datasets: [
					{
						backgroundColor: `${color}1A`, // color with 10% opacity
						borderColor: color,
						data,
						label: `${label} (${unit})`,
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
							label: (context) => {
								return `${context.dataset.label}: ${context.parsed.y} ${unit}`;
							},
							title: (context) => {
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
							text: fbt('Date', 'X-axis label for date in charts'),
						},
						type: 'time',
					},
					y: {
						beginAtZero: false,
						title: {
							display: true,
							text: `${label} (${unit})`,
						},
					},
				},
			},
			plugins: [
				{
					afterDraw: (chart) => {
						const ctx = chart.ctx;
						const xAxis = chart.scales.x;
						const yAxis = chart.scales.y;

						events.forEach((event) => {
							const eventDate = new Date(event.startDate);
							const xPosition = xAxis.getPixelForValue(eventDate.getTime());

							// Only draw if the event is within the visible range
							if (xPosition >= xAxis.left && xPosition <= xAxis.right) {
								// Draw vertical line
								ctx.save();
								ctx.beginPath();
								ctx.moveTo(xPosition, yAxis.top);
								ctx.lineTo(xPosition, yAxis.bottom);
								ctx.lineWidth = 2;
								ctx.strokeStyle = event.color || '#6366f1'; // Default event color
								ctx.setLineDash([5, 5]);
								ctx.stroke();

								// Draw event title
								ctx.textAlign = 'center';
								ctx.fillStyle = event.color || '#6366f1'; // Default event color
								ctx.font = '10px Arial';
								ctx.fillText(event.title, xPosition, yAxis.top - 5);
								ctx.restore();
							}
						});
					},
					id: 'eventLines',
				},
			],
			type: 'line',
		});
	}, [data, label, unit, events, color]);

	useEffect(() => {
		createChart();

		// Cleanup on unmount
		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}
		};
	}, [createChart]);

	if (data.length === 0) {
		return (
			<div className="h-[250px] flex items-center justify-center">
				<p className="text-muted-foreground text-center py-8">
					<fbt desc="No data available for this chart type">
						No data available for{' '}
						<fbt:param name="chartLabel">{label}</fbt:param>.
					</fbt>
				</p>
			</div>
		);
	}

	return (
		<div className="h-[250px]">
			<canvas ref={chartRef} />
		</div>
	);
}
