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

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Not used here
// No longer importing useSingleGrowthChart as it's co-located

interface LineChartProps {
	// Changed to LineChartProps
	backgroundColor: string;
	borderColor: string;
	dataKey: keyof GrowthMeasurement;
	events?: Event[];
	label: string; // This is used for the "no data" message parameter, so it's a string
	measurements: GrowthMeasurement[];
	title: ReactNode; // Allow FbtElement
	unit: string;
}

export default function LineChart({
	// Changed to LineChart
	backgroundColor,
	borderColor,
	dataKey,
	events = [],
	label,
	measurements,
	title,
	unit,
}: LineChartProps) {
	// Changed to LineChartProps
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<Chart | null>(null);

	// Logic from useSingleGrowthChart starts here
	const createChart = useCallback(() => {
		if (!chartRef.current) return;

		const sortedMeasurements = [...measurements].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		const chartData = sortedMeasurements
			.filter((m) => m[dataKey] !== undefined && m[dataKey] !== null)
			.map((m) => ({
				x: new Date(m.date),
				y: m[dataKey] as number,
			}));

		if (chartData.length === 0) {
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
						data: chartData,
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
							text: 'Datum',
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
		measurements,
		events,
		dataKey,
		label,
		unit,
		backgroundColor,
		borderColor,
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
	// Logic from useSingleGrowthChart ends here

	const hasData = measurements.some(
		(m) => m[dataKey] !== undefined && m[dataKey] !== null,
	);

	return (
		<div>
			<h3 className="font-medium mb-2">{title}</h3>
			<div className="h-[250px]">
				{hasData ? (
					<canvas ref={chartRef} />
				) : (
					<p className="text-muted-foreground text-center py-8">
						<fbt desc="no data available for chart">
							No <fbt:param name="dataType">{label.toLowerCase()}</fbt:param>{' '}
							data available.
						</fbt>
					</p>
				)}
			</div>
		</div>
	);
}
