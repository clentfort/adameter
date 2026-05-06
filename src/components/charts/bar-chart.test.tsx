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
	options: {},
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
});
