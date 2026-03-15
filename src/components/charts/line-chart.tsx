'use client';

import type { Chart as ChartJS, TooltipItem } from 'chart.js';
import Chart from 'chart.js/auto';
import { format, isDate } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
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
	pointRadius?: number;
	rangeData?: RangePoint[];
	rangeLabel?: React.ReactNode;
	title: React.ReactNode;
	tooltipLabelFormatter?: (context: TooltipItem<'line'>) => string;
	tooltipTitleFormatter?: (context: TooltipItem<'line'>[]) => string;
	verticalLines?: { color?: string; label?: string; x: number }[];
	xAxisLabel: React.ReactNode;
	xAxisTickCallback?: (value: number | string) => string;
	xAxisType?: 'time' | 'linear';
	xMax?: number;
	xMin?: number;
	yAxisLabel: React.ReactNode;
	yAxisUnit?: string;
	yMax?: number;
	yMin?: number;
}

export default function LineChart({
	backgroundColor = 'rgba(99, 102, 241, 0.1)',
	borderColor = '#6366f1',
	data,
	datasetLabel,
	emptyStateMessage,
	forecastDate,
	pointRadius = 5,
	rangeData = [],
	rangeLabel,
	title,
	tooltipLabelFormatter,
	tooltipTitleFormatter,
	verticalLines = [],
	xAxisLabel,
	xAxisTickCallback,
	xAxisType = 'time',
	xMax,
	xMin,
	yAxisLabel,
	yAxisUnit = '',
	yMax,
	yMin,
}: LineChartProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<ChartJS<'line', PointData[]> | null>(null);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		const ric =
			typeof window !== 'undefined'
				? window.requestIdleCallback ||
					((cb: IdleRequestCallback) => setTimeout(cb, 1))
				: ((cb: IdleRequestCallback) => setTimeout(cb, 1));
		const cic =
			typeof window !== 'undefined'
				? window.cancelIdleCallback || ((id: number) => clearTimeout(id))
				: ((id: number) => clearTimeout(id));

		const handle = ric(() => {
			setIsMounted(true);
		});
		return () => cic(handle);
	}, []);

	const createChart = useCallback(() => {
		if (!chartRef.current || !isMounted) return;

		if (data.length === 0 && rangeData.length === 0) {
			return;
		}

		if (chartInstance.current) {
			const chart = chartInstance.current;
			const isDark =
				typeof window !== 'undefined' &&
				document.documentElement.classList.contains('dark');
			const rangeFillColor = isDark
				? 'rgba(255, 255, 255, 0.1)'
				: 'rgba(0, 0, 0, 0.05)';
			const rangeBorderColor = isDark
				? 'rgba(255, 255, 255, 0.2)'
				: 'rgba(0, 0, 0, 0.1)';

			const datasets: import('chart.js').ChartDataset<'line', PointData[]>[] =
				[];
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
						fill: 0,
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
				pointHoverRadius: pointRadius > 0 ? 7 : 0,
				pointRadius,
				tension: 0.3,
			});

			chart.data.datasets = datasets;

			// Update options
			if (chart.options.scales?.x) {
				chart.options.scales.x.max =
					xMax !== undefined
						? xMax
						: isDate(forecastDate)
							? forecastDate.getTime()
							: typeof forecastDate === 'number'
								? forecastDate
								: undefined;
				chart.options.scales.x.min =
					xMin !== undefined
						? xMin
						: xAxisType === 'time' && data.length > 0
							? Math.min(
									...data.map((d) =>
										isDate(d.x) ? d.x.getTime() : Number(d.x),
									),
								)
							: undefined;
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
			pointHoverRadius: pointRadius > 0 ? 7 : 0,
			pointRadius,
			tension: 0.3,
		});

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
											if (xAxisTickCallback) {
												return xAxisTickCallback(firstItem.parsed.x);
											}
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
						max:
							xMax !== undefined
								? xMax
								: isDate(forecastDate)
									? forecastDate.getTime()
									: typeof forecastDate === 'number'
										? forecastDate
										: undefined,
						min:
							xMin !== undefined
								? xMin
								: xAxisType === 'time' && data.length > 0
									? Math.min(
											...data.map((d) =>
												isDate(d.x) ? d.x.getTime() : Number(d.x),
											),
										)
									: undefined,
						ticks:
							xAxisType === 'linear'
								? {
										callback: xAxisTickCallback
											? (value) => xAxisTickCallback(value)
											: (value) => `${Math.round(Number(value))} mo`,
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
							display: true,
							text: String(xAxisLabel),
						},
						type: xAxisType,
					},
					y: {
						beginAtZero: false,
						max: yMax,
						min: yMin,
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
			plugins: [verticalLinesPlugin],
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
		xAxisTickCallback,
		xAxisType,
		xMax,
		xMin,
		verticalLines,
		pointRadius,
		yAxisLabel,
		yAxisUnit,
		yMax,
		yMin,
		tooltipTitleFormatter,
		tooltipLabelFormatter,
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
