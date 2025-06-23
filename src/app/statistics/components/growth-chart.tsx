'use client';

import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'chartjs-adapter-date-fns'; // Import the date-fns adapter

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
	const headCircumferenceChartRef = useRef<HTMLCanvasElement | null>(null);
	const weightChartInstance = useRef<Chart | null>(null);
	const heightChartInstance = useRef<Chart | null>(null);
	const headCircumferenceChartInstance = useRef<Chart | null>(null);

	// Function to create or update the weight chart
	const createWeightChart = useCallback(() => {
		if (!weightChartRef.current) return;

		// Sort measurements by date (oldest first for the chart)
		const sortedMeasurements = [...measurements].sort(
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

						events.forEach((event) => {
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
	}, [events, measurements]);

	// Function to create or update the height chart
	const createHeightChart = useCallback(() => {
		if (!heightChartRef.current) return;

		// Sort measurements by date (oldest first for the chart)
		const sortedMeasurements = [...measurements].sort(
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

						events.forEach((event) => {
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
	}, [events, measurements]);

	// Function to create or update the head circumference chart
	const createHeadCircumferenceChart = useCallback(() => {
		if (!headCircumferenceChartRef.current) return;

		// Sort measurements by date (oldest first for the chart)
		const sortedMeasurements = [...measurements].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);

		// Prepare data for head circumference chart
		const headCircumferenceData = sortedMeasurements
			.filter((m) => m.headCircumference !== undefined)
			.map((m) => ({
				x: new Date(m.date),
				y: m.headCircumference,
			}));

		if (headCircumferenceData.length === 0) return;

		// Clean up existing chart
		if (headCircumferenceChartInstance.current) {
			headCircumferenceChartInstance.current.destroy();
		}

		const ctx = headCircumferenceChartRef.current.getContext('2d');
		if (!ctx) return;

		// Create new chart
		headCircumferenceChartInstance.current = new Chart(ctx, {
			data: {
				datasets: [
					{
						backgroundColor: 'rgba(59, 130, 246, 0.1)', // Tailwind blue-500
						borderColor: '#3b82f6', // Tailwind blue-500
						data: headCircumferenceData,
						label: 'Kopfumfang (cm)',
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
							text: 'Kopfumfang (cm)',
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
	}, [events, measurements]);

	// Initialize charts when component mounts or data changes
	useEffect(() => {
		if (measurements.length === 0) return;

		// Create all charts
		createWeightChart();
		createHeightChart();
		createHeadCircumferenceChart();

		// Cleanup on unmount
		return () => {
			if (weightChartInstance.current) {
				weightChartInstance.current.destroy();
			}
			if (heightChartInstance.current) {
				heightChartInstance.current.destroy();
			}
			if (headCircumferenceChartInstance.current) {
				headCircumferenceChartInstance.current.destroy();
			}
		};
	}, [
		measurements,
		events,
		createWeightChart,
		createHeightChart,
		createHeadCircumferenceChart,
	]);

	if (measurements.length === 0) {
		return (
			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">
						<fbt desc="growthChart">Growth Chart</fbt>
					</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<p className="text-muted-foreground text-center py-8">
						<fbt desc="noMeasurementsForGrowthChart">
							No measurements available. Add measurements to see the growth
							chart.
						</fbt>
					</p>
				</CardContent>
			</Card>
		);
	}

	const hasWeightData = measurements.some((m) => m.weight !== undefined);
	const hasHeightData = measurements.some((m) => m.height !== undefined);
	const hasHeadCircumferenceData = measurements.some(
		(m) => m.headCircumference !== undefined,
	);

	return (
		<Card>
			<CardHeader className="p-4 pb-2">
				<CardTitle className="text-base">
					<fbt desc="growthChart">Growth Chart</fbt>
				</CardTitle>
			</CardHeader>
			<CardContent className="p-4 pt-0 space-y-6">
				{/* Weight Chart */}
				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="weight">Weight (g)</fbt>
					</h3>
					<div className="h-[250px]">
						{hasWeightData ? (
							<canvas key="weightChart" ref={weightChartRef} />
						) : (
							<p className="text-muted-foreground text-center py-8">
								<fbt desc="noWeightData">No weight data available.</fbt>
							</p>
						)}
					</div>
				</div>

				{/* Height Chart */}
				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="height">Height (cm)</fbt>
					</h3>
					<div className="h-[250px]">
						{hasHeightData ? (
							<canvas key="heightChart" ref={heightChartRef} />
						) : (
							<p className="text-muted-foreground text-center py-8">
								<fbt desc="noHeightData">No height data available.</fbt>
							</p>
						)}
					</div>
				</div>

				{/* Head Circumference Chart */}
				<div>
					<h3 className="font-medium mb-2">
						<fbt desc="headCircumference">Head Circumference (cm)</fbt>
					</h3>
					<div className="h-[250px]">
						{hasHeadCircumferenceData ? (
							<canvas
								key="headCircumferenceChart"
								ref={headCircumferenceChartRef}
							/>
						) : (
							<p className="text-muted-foreground text-center py-8">
								<fbt desc="noHeadCircumferenceData">
									No head circumference data available.
								</fbt>
							</p>
						)}
					</div>
				</div>

				{events.length > 0 && (
					<div className="mt-4 text-xs text-muted-foreground">
						<p>
							<fbt desc="eventsNote">
								* Vertical lines indicate important events.
							</fbt>
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
