import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LineChart from './line-chart';

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
			legend: {
				labels: {},
			},
			tooltip: {
				callbacks: {},
			},
		},
		scales: {
			x: {
				ticks: {},
			},
			y: {
				ticks: {},
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

describe('LineChart', () => {
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

	it('should render and initialize chart with minimal props', async () => {
		const mockData = [{ x: new Date(), y: 10 }];
		render(
			<LineChart
				data={mockData}
				datasetLabel="Test Dataset"
				emptyStateMessage="No data"
				title="Test Chart"
				xAxisLabel="Time"
				yAxisLabel="Value"
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
							data: mockData,
							label: 'Test Dataset',
						}),
					]),
				}),
				options: expect.objectContaining({
					scales: expect.objectContaining({
						x: expect.objectContaining({
							title: expect.objectContaining({ text: 'Time' }),
						}),
						y: expect.objectContaining({
							title: expect.objectContaining({ text: 'Value' }),
						}),
					}),
				}),
				type: 'line',
			}),
		);
	});

	it('should destroy chart instance on unmount', async () => {
		const mockData = [{ x: new Date(), y: 10 }];
		const { unmount } = render(
			<LineChart
				data={mockData}
				datasetLabel="Test Dataset"
				emptyStateMessage="No data"
				title="Test Chart"
				xAxisLabel="Time"
				yAxisLabel="Value"
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(mockChart).toHaveBeenCalledTimes(1);
		unmount();
		expect(mockDestroy).toHaveBeenCalledTimes(1);
	});

	it('should display empty state message when no data is provided', () => {
		render(
			<LineChart
				data={[]}
				datasetLabel="Test Dataset"
				emptyStateMessage="No data to display"
				title="Test Chart"
				xAxisLabel="Time"
				yAxisLabel="Value"
			/>,
		);

		expect(screen.getByText('No data to display')).toBeInTheDocument();
		expect(mockChart).not.toHaveBeenCalled();
	});

	it('should provide maximum coverage by exercising optional props and internal callbacks', async () => {
		const mockData = [
			{ x: new Date('2023-01-01'), y: 10.56 },
			{ x: 1_672_617_600_000, y: 11 }, // number timestamp
		];
		const mockRangeData = [{ x: new Date('2023-01-01'), yMax: 12, yMin: 8 }];
		const mockVerticalLines = [
			{ color: 'red', label: 'Event', x: new Date('2023-01-01').getTime() },
			{ x: new Date('2023-01-02').getTime() }, // No color, no label
		];
		const mockXAxisTickCallback = vi.fn((val) => `custom ${val}`);
		const mockTooltipLabelFormatter = vi.fn(() => 'custom label');
		const mockTooltipTitleFormatter = vi.fn(() => 'custom title');

		const { rerender } = render(
			<LineChart
				data={mockData}
				datasetLabel="Main Dataset"
				emptyStateMessage="No data"
				forecastDate={new Date('2023-01-02')}
				rangeData={mockRangeData}
				rangeLabel="Expected Range"
				title="Test Chart"
				tooltipLabelFormatter={mockTooltipLabelFormatter}
				tooltipTitleFormatter={mockTooltipTitleFormatter}
				verticalLines={mockVerticalLines}
				xAxisLabel="X Axis"
				xAxisTickCallback={mockXAxisTickCallback}
				xAxisType="linear"
				yAxisLabel="Y Axis"
				yAxisUnit="kg"
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(mockChart).toHaveBeenCalled();
		let chartConfig = mockChart.mock.calls.at(-1)![1] as {
			options: {
				plugins: {
					legend: { labels: { filter: (item: { text: string }) => boolean } };
					tooltip: {
						callbacks: {
							label: (item: {
								dataset: { label?: string };
								parsed: { y: number | null };
							}) => string;
							title: (items: { parsed: { x: number | null } }[]) => string;
						};
						filter: (item: { dataset: { label?: string } }) => boolean;
					};
				};
				scales: {
					x: { ticks: { callback: (val: number | string) => string } };
					y: { ticks: { callback: (val: number | string) => string } };
				};
			};
			plugins: {
				beforeDatasetsDraw: (chart: {
					ctx: Record<string, unknown>;
					scales: {
						x: {
							getPixelForValue: (val: number) => number;
							left: number;
							right: number;
						};
						y: { bottom: number; top: number };
					};
				}) => void;
				id?: string;
			}[];
		};

		// Legend filter
		const legendFilter = chartConfig.options.plugins.legend.labels.filter;
		expect(legendFilter({ text: 'Main Dataset' })).toBe(true);
		expect(legendFilter({ text: 'Expected Range' })).toBe(false);

		// Tooltip callbacks (custom)
		const tooltipCallbacks = chartConfig.options.plugins.tooltip.callbacks;
		expect(
			tooltipCallbacks.label({
				dataset: { label: 'Main Dataset' },
				parsed: { y: 10 },
			}),
		).toBe('custom label');
		expect(tooltipCallbacks.title([{ parsed: { x: 100 } }])).toBe(
			'custom title',
		);

		// X Axis Ticks (custom)
		const xAxisTickCallback = chartConfig.options.scales.x.ticks.callback;
		expect(xAxisTickCallback(12)).toBe('custom 12');

		// Vertical Lines Plugin
		const verticalLinesPlugin = chartConfig.plugins.find(
			(p) => p.id === 'verticalLines',
		)!;
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
		const mockChartObj = {
			ctx: mockCtx,
			scales: {
				x: {
					getPixelForValue: vi.fn((val) =>
						val === mockVerticalLines[0].x ? 100 : 300,
					),
					left: 0,
					right: 200,
				},
				y: { bottom: 100, top: 0 },
			},
		};
		verticalLinesPlugin.beforeDatasetsDraw(mockChartObj);
		expect(mockCtx.save).toHaveBeenCalled();
		expect(mockCtx.fillText).toHaveBeenCalledWith('Event', 100, 15);

		// Line without label and color
		mockCtx.fillText.mockClear();
		// Manually invoke with the second line logic by mocking values
		// @ts-ignore
		chartConfig.plugins[0].beforeDatasetsDraw({
			ctx: mockCtx,
			scales: {
				x: { getPixelForValue: () => 50, left: 0, right: 200 },
				y: { bottom: 100, top: 0 },
			},
		});

		// Rerender with data.length = 0 to hit empty state and instance management
		rerender(
			<LineChart
				data={[]}
				datasetLabel="Main Dataset"
				emptyStateMessage="No data"
				rangeData={[]}
				title="Test Chart"
				xAxisLabel="X"
				yAxisLabel="Y"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Rerender to hit more default paths
		rerender(
			<LineChart
				data={[{ x: 50, y: 15 }]}
				datasetLabel="Main Dataset"
				emptyStateMessage="No data"
				forecastDate={300}
				title="Test Chart"
				xAxisLabel="X Axis"
				xAxisTickCallback={mockXAxisTickCallback}
				xAxisType="linear"
				xMax={200}
				xMin={0}
				yAxisLabel="Y Axis"
				yMax={100}
				yMin={0}
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		chartConfig = mockChart.mock.calls.at(-1)![1] as typeof chartConfig;

		// Default tooltip title (linear) with xAxisTickCallback
		expect(
			chartConfig.options.plugins.tooltip.callbacks.title([
				{ parsed: { x: 50 } },
			]),
		).toBe('custom 50');

		// Rerender without custom formatters
		rerender(
			<LineChart
				data={[{ x: 50, y: 15 }]}
				datasetLabel="Main Dataset"
				emptyStateMessage="No data"
				title="Test Chart"
				xAxisLabel="X"
				xAxisType="linear"
				yAxisLabel="Y"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		chartConfig = mockChart.mock.calls.at(-1)![1] as typeof chartConfig;

		// Default X axis tick
		expect(chartConfig.options.scales.x.ticks.callback(10)).toBe('10 mo');

		// Default tooltip title (linear)
		expect(
			chartConfig.options.plugins.tooltip.callbacks.title([
				{ parsed: { x: 50 } },
			]),
		).toBe('50.0 mo');

		// Default callbacks and Time axis
		rerender(
			<LineChart
				data={mockData}
				datasetLabel="Main Dataset"
				emptyStateMessage="No data"
				rangeData={mockRangeData}
				title="Test Chart"
				xAxisLabel="X"
				xAxisType="time"
				yAxisLabel="Y"
				yAxisUnit="kg"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		const timeConfig = mockChart.mock.calls.at(-1)![1] as typeof chartConfig;
		const defaultTooltip = timeConfig.options.plugins.tooltip.callbacks;

		expect(
			defaultTooltip.label({
				dataset: { label: 'Main Dataset' },
				parsed: { y: 10.56 },
			}),
		).toBe('Main Dataset: 10.56 kg');

		// Time axis title
		expect(
			defaultTooltip.title([
				{ parsed: { x: new Date('2023-01-01').getTime() } },
			]),
		).toBe('01. January 2023');

		// Tooltip filter
		expect(
			timeConfig.options.plugins.tooltip.filter({
				dataset: { label: 'Main Dataset' },
			}),
		).toBe(true);
		expect(
			timeConfig.options.plugins.tooltip.filter({
				dataset: { label: 'Range Min' },
			}),
		).toBe(false);

		expect(timeConfig.options.scales.y.ticks.callback(10.23)).toBe('10.2 kg');

		// Mock Dark mode
		document.documentElement.classList.add('dark');

		rerender(
			<LineChart
				data={mockData}
				datasetLabel="Main Dataset"
				emptyStateMessage="No data"
				title="Test Chart"
				xAxisLabel="X"
				yAxisLabel="Y"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		document.documentElement.classList.remove('dark');
	});

	it('exercises additional reachable branches for maximum coverage improvement', async () => {
		const mockData = [{ x: new Date('2023-01-01'), y: 10.56 }];
		const mockRangeData = [{ x: new Date('2023-01-01'), yMax: 12, yMin: 8 }];
		const mockVerticalLines = [
			{ label: 'Marker', x: new Date('2023-01-01').getTime() },
		];

		const { rerender } = render(
			<LineChart
				data={mockData}
				datasetLabel="Main"
				emptyStateMessage="No data"
				forecastDate={1_672_617_600_000}
				pointRadius={0}
				rangeData={mockRangeData}
				rangeLabel="Range"
				title="Test Chart"
				verticalLines={mockVerticalLines}
				xAxisLabel="Time"
				yAxisLabel="Value"
				yAxisUnit="kg"
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		type MockChartConfig = {
			data: { datasets: { pointHoverRadius: number }[] };
			options: {
				plugins: {
					tooltip: {
						callbacks: {
							label: (item: {
								dataset: { label: string };
								parsed: { y: number | null };
							}) => string;
							title: (items: { parsed: { x: number | null } }[]) => string;
						};
					};
				};
				scales: {
					x: { max?: number; min?: number };
					y: { ticks: { callback: (val: number) => string | number } };
				};
			};
			plugins: {
				beforeDatasetsDraw: (chart: {
					ctx: unknown;
					scales: {
						x: {
							getPixelForValue: (v: number) => number;
							left: number;
							right: number;
						};
						y: { bottom: number; top: number };
					};
				}) => void;
				id: string;
			}[];
		};

		const getLatestConfig = () =>
			mockChart.mock.calls.at(-1)![1] as MockChartConfig;

		let chartConfig = getLatestConfig();
		const tooltipCallbacks = chartConfig.options.plugins.tooltip.callbacks;

		// Hit pointHoverRadius 0 branch
		expect(chartConfig.data.datasets.at(-1)!.pointHoverRadius).toBe(0);

		// Hit line 282 (tooltip label for range)
		expect(
			tooltipCallbacks.label({
				dataset: { label: 'Range' },
				parsed: { y: 8 },
			}),
		).toBe('');

		// Hit line 288 (default label with unit)
		expect(
			tooltipCallbacks.label({
				dataset: { label: 'Main' },
				parsed: { y: 10.56 },
			}),
		).toBe('Main: 10.56 kg');

		// Hit line 297 (tooltip title for empty/invalid items)
		expect(tooltipCallbacks.title([])).toBe('');
		expect(tooltipCallbacks.title([{ parsed: { x: null } }])).toBe('');

		// Hit line 308 (default time axis title)
		const date = new Date('2023-01-01');
		expect(tooltipCallbacks.title([{ parsed: { x: date.getTime() } }])).toBe(
			'01. January 2023',
		);

		// Hit line 337 (number forecast date)
		expect(chartConfig.options.scales.x.max).toBe(1_672_617_600_000);

		// Hit line 388 (Y axis tick without unit)
		rerender(
			<LineChart
				data={mockData}
				datasetLabel="Main"
				emptyStateMessage="No data"
				title="Test Chart"
				xAxisLabel="Time"
				yAxisLabel="Value"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		chartConfig = getLatestConfig();
		expect(chartConfig.options.scales.y.ticks.callback(10.55)).toBe(10.6);

		// Hit Date forecast and time axis with empty data but non-empty range
		rerender(
			<LineChart
				data={[]}
				datasetLabel="Main"
				emptyStateMessage="No data"
				forecastDate={new Date('2023-01-02')}
				rangeData={mockRangeData}
				title="Test Chart"
				xAxisLabel="Time"
				xAxisType="time"
				yAxisLabel="Value"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		chartConfig = getLatestConfig();
		expect(chartConfig.options.scales.x.max).toBe(
			new Date('2023-01-02').getTime(),
		);
		expect(chartConfig.options.scales.x.min).toBeUndefined();

		// Hit linear axis tooltip title default branch
		rerender(
			<LineChart
				data={[{ x: 10, y: 10 }]}
				datasetLabel="Main"
				emptyStateMessage="No data"
				title="Test Chart"
				xAxisLabel="Time"
				xAxisType="linear"
				yAxisLabel="Value"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		chartConfig = getLatestConfig();
		expect(
			chartConfig.options.plugins.tooltip.callbacks.title([
				{ parsed: { x: 10.5 } },
			]),
		).toBe('10.5 mo');

		// Hit dark mode colors for range and vertical lines
		document.documentElement.classList.add('dark');
		rerender(
			<LineChart
				data={mockData}
				datasetLabel="Main"
				emptyStateMessage="No data"
				rangeData={mockRangeData}
				title="Test Chart"
				verticalLines={mockVerticalLines}
				xAxisLabel="Time"
				yAxisLabel="Value"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});
		chartConfig = getLatestConfig();

		// Exercise vertical lines plugin in dark mode with label
		const verticalLinesPlugin = chartConfig.plugins.find(
			(p) => p.id === 'verticalLines',
		)!;
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
		const mockChartObj = {
			ctx: mockCtx,
			scales: {
				x: { getPixelForValue: () => 100, left: 0, right: 200 },
				y: { bottom: 100, top: 0 },
			},
		};
		verticalLinesPlugin.beforeDatasetsDraw(mockChartObj);
		expect(mockCtx.save).toHaveBeenCalled();
		expect(mockCtx.fillText).toHaveBeenCalledWith('Marker', 100, 15);

		document.documentElement.classList.remove('dark');

		// Try to hit line 82 (requires ref but no data - though difficult due to early return)
		rerender(
			<LineChart
				data={[]}
				datasetLabel="Main"
				emptyStateMessage="No data"
				rangeData={[]}
				title="Test Chart"
				xAxisLabel="Time"
				yAxisLabel="Value"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Hit line 164 (null context)
		const originalGetContext = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = vi.fn(
			() => null,
		) as unknown as typeof HTMLCanvasElement.prototype.getContext;

		rerender(
			<LineChart
				data={[{ x: new Date(), y: 20 }]}
				datasetLabel="Main"
				emptyStateMessage="No data"
				title="Test"
				xAxisLabel="X"
				yAxisLabel="Y"
			/>,
		);
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// Restore context for other tests
		HTMLCanvasElement.prototype.getContext = originalGetContext;
	});
});
