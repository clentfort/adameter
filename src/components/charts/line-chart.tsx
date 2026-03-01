'use client';

import type { Chart as ChartJS, TooltipItem } from 'chart.js';
import Chart from 'chart.js/auto';
import { format, isDate } from 'date-fns';
import { useCallback, useEffect, useRef } from 'react';
import 'chartjs-adapter-date-fns';

interface PointData {
	x: Date | number;
	y: number;
}

interface RangePoint {
	x: Date | number;
	yMax: number;
	yMin: number;
}

interface LineChartProps {
	backgroundColor?: string;
	borderColor?: string;
	data: PointData[];
	datasetLabel: React.ReactNode;
	emptyStateMessage: React.ReactNode;
	forecastDate?: Date | number;
	rangeData?: RangePoint[];
	rangeLabel?: React.ReactNode;
	title: React.ReactNode;
	tooltipLabelFormatter?: (context: TooltipItem<'line'>) => string;
	tooltipTitleFormatter?: (context: TooltipItem<'line'>[]) => string;
	xAxisLabel: React.ReactNode;
	xAxisType?: 'time' | 'linear';
	yAxisLabel: React.ReactNode;
	yAxisUnit?: string;
}

export default function LineChart({
	backgroundColor = 'rgba(99, 102, 241, 0.1)',
	borderColor = '#6366f1',
	data,
	datasetLabel,
	emptyStateMessage,
	forecastDate,
	rangeData = [],
	rangeLabel,
	title,
	tooltipLabelFormatter,
	tooltipTitleFormatter,
	xAxisLabel,
	xAxisType = 'time',
	yAxisLabel,
	yAxisUnit = '',
}: LineChartProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<ChartJS<'line', PointData[]> | null>(null);

	const createChart = useCallback(() => {
		if (!chartRef.current) return;

		if (data.length === 0 && rangeData.length === 0) {
			return;
		}

		if (chartInstance.current) {
			chartInstance.current.destroy();
		}

		const ctx = chartRef.current.getContext('2d');
		if (!ctx) return;

		const datasets: import('chart.js').ChartDataset<'line', PointData[]>[] = [];

		const isDark =
			typeof window !== 'undefined' &&
			document.documentElement.classList.contains('dark');
		const rangeFillColor = isDark
			? 'rgba(255, 255, 255, 0.1)'
			: 'rgba(0, 0, 0, 0.05)';
		const rangeBorderColor = isDark
			? 'rgba(255, 255, 255, 0.2)'
			: 'rgba(0, 0, 0, 0.1)';

		if (rangeData.length > 0) {
			datasets.push(
				{
					backgroundColor: 'transparent',
					borderColor: 'transparent',
					data: rangeData.map((d) => ({ x: d.x, y: d.yMin })),
					fill: false,
					label: String(rangeLabel || 'Range Min'),
					pointRadius: 0,
				},
				{
					backgroundColor: rangeFillColor,
					borderColor: rangeBorderColor,
					borderWidth: 1,
					data: rangeData.map((d) => ({ x: d.x, y: d.yMax })),
					fill: 0, // Fill to the first dataset (Range Min)
					label: String(rangeLabel || 'Range Max'),
					pointRadius: 0,
				},
			);
		}

		datasets.push({
			backgroundColor,
			borderColor,
			data,
			label: String(datasetLabel),
			pointHoverRadius: 7,
			pointRadius: 5,
			tension: 0.3,
		});

		chartInstance.current = new Chart<'line', PointData[]>(ctx, {
			data: {
				datasets,
			},
			options: {
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: !!datasetLabel,
						labels: {
							filter: (item) => {
								// Hide the range min/max from legend, just show the main dataset
								return item.text === String(datasetLabel);
							},
						},
					},
					tooltip: {
						callbacks: {
							label: tooltipLabelFormatter
								? tooltipLabelFormatter
								: (context) => {
										let label = context.dataset.label || '';
										if (
											label === String(rangeLabel || 'Range Min') ||
											label === String(rangeLabel || 'Range Max')
										) {
											return '';
										}
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
										const firstItem = context[0];
										if (!firstItem || firstItem.parsed.x === null) {
											return '';
										}

										if (xAxisType === 'linear') {
											return `${Number(firstItem.parsed.x).toFixed(1)} mo`;
										}

										const date = new Date(Number(firstItem.parsed.x));
										return format(date, 'dd. MMMM yyyy');
									},
						},
						filter: (tooltipItem) => {
							// Don't show tooltips for range datasets
							return (
								tooltipItem.dataset.label !==
									String(rangeLabel || 'Range Min') &&
								tooltipItem.dataset.label !== String(rangeLabel || 'Range Max')
							);
						},
					},
				},
				responsive: true,
				scales: {
					x: {
						adapters: {
							date: {},
						},
						grid: {
							display: true,
						},
						max: isDate(forecastDate)
							? forecastDate.getTime()
							: typeof forecastDate === 'number'
								? forecastDate
								: undefined,
						ticks:
							xAxisType === 'linear'
								? {
										callback: (value) => `${Math.round(Number(value))} mo`,
										stepSize: 3,
									}
								: undefined,
						time:
							xAxisType === 'time'
								? {
										displayFormats: {
											day: 'dd.MM',
											month: 'MMM yyyy',
										},
										min:
											data.length > 0
												? Math.min(
														...data.map((d) =>
															isDate(d.x) ? d.x.getTime() : Number(d.x),
														),
													)
												: undefined,
										unit: 'month', // Monthly grid lines
									}
								: undefined,
						title: {
							display: true,
							text: String(xAxisLabel),
						},
						type: xAxisType,
					},
					y: {
						beginAtZero: false,
						ticks: {
							callback:
								yAxisUnit && typeof yAxisUnit === 'string'
									? (value) => `${value} ${yAxisUnit}`
									: undefined,
						},
						title: {
							display: true,
							text: String(yAxisLabel),
						},
					},
				},
			},
			type: 'line',
		});
	}, [
		data,
		rangeData,
		rangeLabel,
		forecastDate,
		backgroundColor,
		borderColor,
		datasetLabel,
		xAxisLabel,
		xAxisType,
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

	if (data.length === 0 && rangeData.length === 0) {
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
