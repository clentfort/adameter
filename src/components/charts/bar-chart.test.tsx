import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BarChart from './bar-chart';

const mockDestroy = vi.fn();
const mockUpdate = vi.fn();
const mockChartInstance = {
	data: {
		datasets: [],
		labels: [],
	},
	destroy: mockDestroy,
	options: {
		plugins: {
			title: {
				text: '',
			},
		},
		scales: {
			y: {
				max: undefined as number | undefined,
				min: undefined as number | undefined,
			},
		},
	},
	update: mockUpdate,
};
const mockChart = vi.fn((...args: unknown[]) => mockChartInstance);

vi.mock('chart.js/auto', () => ({
	default: class Chart {
		constructor(...args: unknown[]) {
			return mockChart(...args);
		}
	},
}));

vi.mock('chartjs-adapter-date-fns', () => ({}));

describe('BarChart', () => {
	let mockCanvasContext: CanvasRenderingContext2D;

	beforeEach(() => {
		mockCanvasContext = {} as unknown as CanvasRenderingContext2D;
		HTMLCanvasElement.prototype.getContext = vi.fn(
			() => mockCanvasContext,
		) as unknown as typeof HTMLCanvasElement.prototype.getContext;
	});

	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it('should render and initialize chart with datasets and labels', async () => {
		const datasets = [
			{ backgroundColor: 'red', data: [10, 20], label: 'Set 1' },
			{ backgroundColor: 'blue', data: [5, 15], label: 'Set 2' },
		];
		const labels = ['Day 1', 'Day 2'];

		render(
			<BarChart
				datasets={datasets}
				emptyStateMessage="No data"
				labels={labels}
				title="Test Chart"
				xAxisLabel="Days"
				yAxisLabel="Hours"
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(screen.getByRole('graphics-document')).toBeInTheDocument();
		expect(mockChart).toHaveBeenCalledTimes(1);
		expect(mockChart).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({
				data: expect.objectContaining({
					datasets: expect.arrayContaining([
						expect.objectContaining({
							backgroundColor: 'red',
							data: [10, 20],
							label: 'Set 1',
						}),
						expect.objectContaining({
							backgroundColor: 'blue',
							data: [5, 15],
							label: 'Set 2',
						}),
					]),
					labels,
				}),
				type: 'bar',
			}),
		);
	});

	it('should display empty state message when no datasets are provided', () => {
		render(
			<BarChart
				datasets={[]}
				emptyStateMessage="No data to display"
				labels={['Day 1']}
				title="Test Chart"
				xAxisLabel="Days"
				yAxisLabel="Hours"
			/>,
		);

		expect(screen.getByText('No data to display')).toBeInTheDocument();
		expect(mockChart).not.toHaveBeenCalled();
	});

	it('should display empty state message when no labels are provided', () => {
		render(
			<BarChart
				datasets={[{ backgroundColor: 'red', data: [10], label: 'Set 1' }]}
				emptyStateMessage="No data to display"
				labels={[]}
				title="Test Chart"
				xAxisLabel="Days"
				yAxisLabel="Hours"
			/>,
		);

		expect(screen.getByText('No data to display')).toBeInTheDocument();
		expect(mockChart).not.toHaveBeenCalled();
	});

	it('should exercise vertical lines, tooltips, and axis labels', async () => {
		const datasets = [{ backgroundColor: 'red', data: [10], label: 'Set 1' }];
		const labels = ['Day 1'];
		const verticalLines = [{ color: 'blue', label: 'Event', x: 0 }];

		render(
			<BarChart
				absYLabels={true}
				datasets={datasets}
				emptyStateMessage="No data"
				labels={labels}
				title="Test Chart"
				verticalLines={verticalLines}
				xAxisLabel="Days"
				yAxisLabel="Hours"
				yAxisUnit="h"
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		const chartConfig = mockChart.mock.calls[0][1] as unknown as {
			options: {
				plugins: {
					tooltip: {
						callbacks: {
							label: (ctx: unknown) => string;
							title: (ctx: unknown[]) => string;
						};
					};
				};
				scales: {
					y: {
						ticks: {
							callback: (val: number) => string;
						};
					};
				};
			};
			plugins: {
				beforeDatasetsDraw: (chart: unknown) => void;
				id: string;
			}[];
		};

		// Test vertical lines plugin
		const verticalLinesPlugin = chartConfig.plugins.find(
			(p) => p.id === 'verticalLines',
		);
		const mockCtx = {
			beginPath: vi.fn(),
			fillText: vi.fn(),
			lineTo: vi.fn(),
			moveTo: vi.fn(),
			restore: vi.fn(),
			save: vi.fn(),
			setLineDash: vi.fn(),
			stroke: vi.fn(),
		};
		const mockScales = {
			x: { getPixelForValue: vi.fn(() => 50), left: 0, right: 100 },
			y: { bottom: 100, top: 0 },
		};
		verticalLinesPlugin?.beforeDatasetsDraw({
			ctx: mockCtx,
			scales: mockScales,
		} as unknown);

		expect(mockCtx.save).toHaveBeenCalled();
		expect(mockCtx.stroke).toHaveBeenCalled();
		expect(mockCtx.fillText).toHaveBeenCalledWith('Event', 50, 15);
		expect(mockCtx.restore).toHaveBeenCalled();

		// Test tooltip label callback
		const labelCallback = chartConfig.options.plugins.tooltip.callbacks.label;
		const mockContext = {
			dataset: { label: 'Set 1' },
			parsed: { y: 10.55 },
		};
		expect(labelCallback(mockContext as unknown)).toBe('Set 1: 10.6 h');

		// Test tooltip title callback
		const titleCallback = chartConfig.options.plugins.tooltip.callbacks.title;
		expect(titleCallback([{ label: 'Day 1' }] as unknown[])).toBe('Day 1');

		// Test y-axis tick callback
		const tickCallback = chartConfig.options.scales.y.ticks.callback;
		expect(tickCallback(-15.5)).toBe('15.5h');
		expect(tickCallback(10)).toBe('10h');
	});

	it('should return early if datasets become empty after initial mount', async () => {
		const { rerender } = render(
			<BarChart
				datasets={[{ backgroundColor: 'red', data: [10], label: 'Set 1' }]}
				emptyStateMessage="No data"
				labels={['Day 1']}
				title="Test Chart"
				xAxisLabel="Days"
				yAxisLabel="Hours"
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(mockChart).toHaveBeenCalledTimes(1);

		rerender(
			<BarChart
				datasets={[]}
				emptyStateMessage="No data"
				labels={['Day 1']}
				title="Test Chart"
				xAxisLabel="Days"
				yAxisLabel="Hours"
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(screen.getByText('No data')).toBeInTheDocument();
	});

	it('should exercise chart updates, dark mode, default tooltips, and vertical line edge cases', async () => {
		document.documentElement.classList.add('dark');

		const initialDatasets = [
			{
				backgroundColor: 'red',
				data: [10],
				label: 'Set 1',
				stack: 'comparison',
			},
		];
		const verticalLines = [
			{ color: 'purple', label: 'Marker', x: 0 },
			{ x: 100 }, // Out of bounds pixel xPos, default colors
		];

		const { rerender } = render(
			<BarChart
				datasets={initialDatasets}
				emptyStateMessage="No data"
				grouped={false}
				labels={['Day 1']}
				title="Initial Title"
				verticalLines={verticalLines}
				xAxisLabel="X Axis"
				yAxisLabel="Y Axis"
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		type MockChartConfig = {
			data: {
				datasets: {
					borderRadius: number;
					categoryPercentage: number;
					grouped: boolean;

				}[];
			};
			options: {
				plugins: {
					title: { display: boolean; text: string };
					tooltip: {
						callbacks: {
							label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => string;
						};
					};
				};
				scales: {
					y: { ticks: { callback: (val: number) => string | number } };
				};
			};
			plugins: {
				beforeDatasetsDraw: (chart: {
					ctx: unknown;
					scales: {
						x: { getPixelForValue: (v: number) => number; left: number; right: number };
						y: { bottom: number; top: number };
					};
				}) => void;
				id: string;
			}[];
		};

		const chartConfig = mockChart.mock.calls[0][1] as unknown as MockChartConfig;

		// Check categoryPercentage and borderRadius for grouped=false and stack='comparison'
		expect(chartConfig.data.datasets[0].categoryPercentage).toBe(1.0);
		expect(chartConfig.data.datasets[0].borderRadius).toBe(0);

		// Test default tooltip label callback without unit or label, and with null parsed y
		const labelCallback = chartConfig.options.plugins.tooltip.callbacks.label;
		expect(labelCallback({ dataset: {}, parsed: { y: 12.34 } })).toBe('12.3');
		expect(labelCallback({ dataset: { label: 'Set 1' }, parsed: { y: null } })).toBe('Set 1: ');

		// Test y-axis tick callback without unit
		const tickCallback = chartConfig.options.scales.y.ticks.callback;
		expect(tickCallback(25.43)).toBe(25.4);

		// Test vertical line plugin in dark mode with out-of-bounds line and default color line
		const verticalLinesPlugin = chartConfig.plugins.find((p) => p.id === 'verticalLines')!;
		const mockCtx = {
			beginPath: vi.fn(),
			fillStyle: '',
			fillText: vi.fn(),
			font: '',
			lineTo: vi.fn(),
			lineWidth: 0,
			moveTo: vi.fn(),
			restore: vi.fn(),
			save: vi.fn(),
			setLineDash: vi.fn(),
			stroke: vi.fn(),
			strokeStyle: '',
			textAlign: '',
		};

		const mockScales = {
			x: {
				getPixelForValue: vi.fn((val) => (val === 0 ? 50 : 250)),
				left: 0,
				right: 200,
			},
			y: { bottom: 100, top: 0 },
		};

		verticalLinesPlugin.beforeDatasetsDraw({ ctx: mockCtx, scales: mockScales });
		expect(mockCtx.save).toHaveBeenCalled();
		expect(mockCtx.fillText).toHaveBeenCalledWith('Marker', 50, 15);
		expect(mockCtx.restore).toHaveBeenCalled();

		// Update chart instance via rerender
		const updatedDatasets = [
			{ backgroundColor: 'blue', data: [20], label: 'Updated Set' },
		];

		rerender(
			<BarChart
				datasets={updatedDatasets}
				emptyStateMessage="No data"
				grouped={true}
				labels={['Day 1']}
				title="Updated Title"
				xAxisLabel="X Axis"
				yAxisLabel="Y Axis"
				yMax={100}
				yMin={0}
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(mockChart).toHaveBeenCalledTimes(2);
		expect(mockDestroy).toHaveBeenCalledTimes(1);

		document.documentElement.classList.remove('dark');
	});
});
