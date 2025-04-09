'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GrowthMeasurement } from '@/types/growth';
import type { Event } from '@/types/event';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns'; // Import the date-fns adapter
import { useTranslate } from '@/utils/translate';

interface GrowthChartProps {
	events?: Event[];
	measurements: GrowthMeasurement[];
}

export default function GrowthChart({
	events = [],
	measurements = [],
}: GrowthChartProps) {
	const weightChartRef = useRef<HTMLCanvasElement | null>(null);
	const heightChartRef = useRef<HTMLCanvasElement | null>(null);
	const weightChartInstance = useRef<Chart | null>(null);
	const heightChartInstance = useRef<Chart | null>(null);

	// Ensure measurements is an array
	const measurementsArray = Array.isArray(measurements) ? measurements : [];
	const eventsArray = Array.isArray(events) ? events : [];

	// Add t constant inside the component
	const t = useTranslate();

	// Function to create or update the weight chart
	const createWeightChart = () => {
		if (!weightChartRef.current) return;

		// Sort measurements by date (oldest first for the chart)
		const sortedMeasurements = [...measurementsArray].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		// Prepare data for weight chart
		const weightData = sortedMeasurements
			.filter((m) => m.weight !== undefined)
			.map((m) => ({
				x: new Date(m.date),
				y: m.weight,
			}));

		if (weightData.length === 0) return;

		// Clean up existing chart
		if (weightChartInstance.current) {
			weightChartInstance.current.destroy();
		}

		const ctx = weightChartRef.current.getContext('2d');
		if (!ctx) return;

		// Create new chart
		weightChartInstance.current = new Chart(ctx, {
			data: {
				datasets: [
					{
						backgroundColor: 'rgba(99, 102, 241, 0.1)',
						borderColor: '#6366f1',
						data: weightData,
						label: 'Gewicht (g)',
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
							text: 'Gewicht (g)',
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

						eventsArray.forEach((event) => {
							const eventDate = new Date(event.startDate);
							const xPosition = xAxis.getPixelForValue(eventDate);

							// Only draw if the event is within the visible range
							if (xPosition >= xAxis.left && xPosition <= xAxis.right) {
								// Draw vertical line
								ctx.save();
								ctx.beginPath();
								ctx.moveTo(xPosition, yAxis.top);
								ctx.lineTo(xPosition, yAxis.bottom);
								ctx.lineWidth = 2;
								ctx.strokeStyle = event.color || '#6366f1';
								ctx.setLineDash([5, 5]);
								ctx.stroke();

								// Draw event title
								ctx.textAlign = 'center';
								ctx.fillStyle = event.color || '#6366f1';
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
	};

	// Function to create or update the height chart
	const createHeightChart = () => {
		if (!heightChartRef.current) return;

		// Sort measurements by date (oldest first for the chart)
		const sortedMeasurements = [...measurementsArray].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		// Prepare data for height chart
		const heightData = sortedMeasurements
			.filter((m) => m.height !== undefined)
			.map((m) => ({
				x: new Date(m.date),
				y: m.height,
			}));

		if (heightData.length === 0) return;

		// Clean up existing chart
		if (heightChartInstance.current) {
			heightChartInstance.current.destroy();
		}

		const ctx = heightChartRef.current.getContext('2d');
		if (!ctx) return;

		// Create new chart
		heightChartInstance.current = new Chart(ctx, {
			data: {
				datasets: [
					{
						backgroundColor: 'rgba(236, 72, 153, 0.1)',
						borderColor: '#ec4899',
						data: heightData,
						label: 'Größe (cm)',
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
							text: 'Größe (cm)',
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

						eventsArray.forEach((event) => {
							const eventDate = new Date(event.startDate);
							const xPosition = xAxis.getPixelForValue(eventDate);

							// Only draw if the event is within the visible range
							if (xPosition >= xAxis.left && xPosition <= xAxis.right) {
								// Draw vertical line
								ctx.save();
								ctx.beginPath();
								ctx.moveTo(xPosition, yAxis.top);
								ctx.lineTo(xPosition, yAxis.bottom);
								ctx.lineWidth = 2;
								ctx.strokeStyle = event.color || '#6366f1';
								ctx.setLineDash([5, 5]);
								ctx.stroke();

								// Draw event title
								ctx.textAlign = 'center';
								ctx.fillStyle = event.color || '#6366f1';
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
	};

	// Initialize charts when component mounts or data changes
	useEffect(() => {
		if (measurementsArray.length === 0) return;

		// Create both charts
		createWeightChart();
		createHeightChart();

		// Cleanup on unmount
		return () => {
			if (weightChartInstance.current) {
				weightChartInstance.current.destroy();
			}
			if (heightChartInstance.current) {
				heightChartInstance.current.destroy();
			}
		};
	}, [measurementsArray, eventsArray]);

	if (measurementsArray.length === 0) {
		return (
			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">{t('growthChart')}</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<p className="text-muted-foreground text-center py-8">
						{t('noMeasurementsForGrowthChart')}
					</p>
				</CardContent>
			</Card>
		);
	}

	const hasWeightData = measurementsArray.some((m) => m.weight !== undefined);
	const hasHeightData = measurementsArray.some((m) => m.height !== undefined);

	return (
		<Card>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">{t('growthChart')}</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0 space-y-6">
				{/* Weight Chart */}
				<div>
					<h3 className="font-medium mb-2">{t('weight')}</h3>
					<div className="h-[250px]">
						{hasWeightData ? (
							<canvas key="weightChart" ref={weightChartRef} />
						) : (
							<p className="text-muted-foreground text-center py-8">
								{t('noWeightData')}
							</p>
						)}
					</div>
				</div>

				{/* Height Chart */}
				<div>
					<h3 className="font-medium mb-2">{t('height')}</h3>
					<div className="h-[250px]">
						{hasHeightData ? (
							<canvas key="heightChart" ref={heightChartRef} />
						) : (
							<p className="text-muted-foreground text-center py-8">
								{t('noHeightData')}
							</p>
						)}
					</div>
				</div>

				{eventsArray.length > 0 && (
					<div className="mt-4 text-xs text-muted-foreground">
						<p>{t('eventsNote')}</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
