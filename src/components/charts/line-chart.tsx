'use client';

import type { Chart as ChartJS } from 'chart.js';
import Chart from 'chart.js/auto';
import { format, isDate } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import 'chartjs-adapter-date-fns';
import { useIdleCallback } from '@/hooks/use-idle-callback';
import { legendLabels, useChartTheme } from './chart-theme';

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
	title: _title,
	xAxisLabel,
	xAxisType = 'time',
	yAxisLabel,
	yAxisUnit = '',
}: LineChartProps) {
	const theme = useChartTheme();
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<ChartJS<'line', PointData[]> | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	useIdleCallback(() => {
		setIsMounted(true);
	}, []);

	const createChart = useCallback(() => {
		if (!chartRef.current || !isMounted) return;

		if (data.length === 0 && rangeData.length === 0) {
			return;
		}

		const ctx = chartRef.current.getContext('2d');
		if (!ctx) return;

		const datasets: import('chart.js').ChartDataset<'line', PointData[]>[] = [];

		const rangeFillColor = theme.rangeFill;
		const rangeBorderColor = theme.rangeBorder;

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
							...legendLabels(theme),
							filter: (item) => {
								// Hide the range min/max from legend, just show the main dataset
								return item.text === String(datasetLabel);
							},
						},
					},
					tooltip: {
						callbacks: {
							label: (context) => {
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
							title: (context) => {
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
							color: theme.grid,
							display: true,
						},
						max: isDate(forecastDate)
							? forecastDate.getTime()
							: typeof forecastDate === 'number'
								? forecastDate
								: undefined,
						min:
							xAxisType === 'time' && data.length > 0
								? Math.min(
										...data.map((d) =>
											isDate(d.x) ? d.x.getTime() : Number(d.x),
										),
									)
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
										unit: 'month', // Monthly grid lines
									}
								: undefined,
						title: {
							color: theme.foreground,
							display: true,
							text: String(xAxisLabel),
						},
						type: xAxisType,
					},
					y: {
						beginAtZero: false,
						grid: {
							color: theme.grid,
						},
						ticks: {
							callback: (value) => {
								const val = Math.round(Number(value) * 10) / 10;
								return yAxisUnit && typeof yAxisUnit === 'string'
									? `${val} ${yAxisUnit}`
									: val;
							},
						},
						title: {
							color: theme.foreground,
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
		isMounted,
		theme,
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

	if (!isMounted || (data.length === 0 && rangeData.length === 0)) {
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
