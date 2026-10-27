import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PieChart from './pie-chart';

const mockDestroy = vi.fn();
const mockChartInstance = {
	data: {
		datasets: [],
		labels: [],
	},
	destroy: mockDestroy,
	options: {
		plugins: {
			legend: {
				display: true,
			},
			title: {
				display: false,
				text: '',
			},
		},
	},
};
const mockChart = vi.fn((...args: unknown[]) => mockChartInstance);

vi.mock('chart.js/auto', () => ({
	default: class Chart {
		constructor(...args: unknown[]) {
			return mockChart(...args);
		}
	},
}));

describe('PieChart', () => {
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

	it('should handle full lifecycle including initialization, updates, and empty state', async () => {
		// 1. Initial render with data
		const datasets = [
			{ backgroundColor: ['red', 'blue'], data: [10, 20], label: 'Set 1' },
		];
		const labels = ['A', 'B'];

		const { rerender } = render(
			<PieChart
				datasets={datasets}
				emptyStateMessage="No data"
				labels={labels}
			/>,
		);

		// Wait for idle callback and useEffect
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(screen.getByRole('graphics-document')).toBeInTheDocument();
		expect(mockChart).toHaveBeenCalledTimes(1);

		// 2. Update props to rebuild chart
		const updatedDatasets = [
			{ backgroundColor: ['green'], data: [30], label: 'Set 2' },
		];
		const updatedLabels = ['C'];
		rerender(
			<PieChart
				datasets={updatedDatasets}
				emptyStateMessage="No data"
				labels={updatedLabels}
			/>,
		);

		expect(mockDestroy).toHaveBeenCalledTimes(1);
		expect(mockChart).toHaveBeenCalledTimes(2);

		// 3. Render empty state to exercise the early return logic
		rerender(
			<PieChart
				datasets={[]}
				emptyStateMessage="No data to display"
				labels={[]}
			/>,
		);

		expect(screen.getByText('No data to display')).toBeInTheDocument();
		expect(screen.queryByRole('graphics-document')).not.toBeInTheDocument();
	});

	it('creates chart when data goes from empty to non-empty', async () => {
		const { rerender } = render(
			<PieChart datasets={[]} emptyStateMessage="No data" labels={[]} />,
		);

		rerender(
			<PieChart
				datasets={[{ backgroundColor: ['red'], data: [10], label: 'Set 1' }]}
				emptyStateMessage="No data"
				labels={['A']}
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(mockChart).toHaveBeenCalledTimes(1);
	});

	it('exercises the default tooltip label formatter', async () => {
		const datasets = [{ backgroundColor: ['red'], data: [10], label: 'Set 1' }];
		const labels = ['A'];

		render(
			<PieChart
				datasets={datasets}
				emptyStateMessage="No data"
				labels={labels}
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		const chartConfig = mockChart.mock.calls[0][1] as {
			options: {
				plugins: {
					tooltip: {
						callbacks: {
							label: (context: {
								label: string;
								parsed: number | null;
							}) => string;
						};
					};
				};
			};
		};
		const labelFormatter = chartConfig.options.plugins.tooltip.callbacks.label;

		// Test with label
		expect(labelFormatter({ label: 'Apples', parsed: 10 })).toBe('Apples: 10');
		// Test without label
		expect(labelFormatter({ label: '', parsed: 20 })).toBe('20');
		// Test with null parsed
		expect(labelFormatter({ label: 'Apples', parsed: null })).toBe('Apples: ');
	});

	it('exercises dark mode and null canvas context', async () => {
		document.documentElement.classList.add('dark');
		const datasets = [{ backgroundColor: ['red'], data: [10], label: 'Set 1' }];

		const { unmount } = render(
			<PieChart
				datasets={datasets}
				emptyStateMessage="No data"
				labels={['A']}
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		const chartConfig = mockChart.mock.calls.at(-1)![1] as {
			options: {
				plugins: {
					legend: { labels: { color: string } };
					title: { color: string };
				};
			};
		};

		expect(chartConfig.options.plugins.legend.labels.color).toBe('#f4f4f5');
		expect(chartConfig.options.plugins.title.color).toBe('#f4f4f5');

		unmount();
		document.documentElement.classList.remove('dark');

		const originalGetContext = HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.getContext = vi.fn(
			() => null,
		) as unknown as typeof HTMLCanvasElement.prototype.getContext;

		render(
			<PieChart
				datasets={datasets}
				emptyStateMessage="No data"
				labels={['A']}
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		HTMLCanvasElement.prototype.getContext = originalGetContext;
	});

	it('handles early return branches when datasets become empty after canvas render', async () => {
		const datasets = [{ backgroundColor: ['red'], data: [10], label: 'Set 1' }];

		render(
			<PieChart
				datasets={datasets}
				emptyStateMessage="No data"
				labels={['A']}
			/>,
		);

		// Mutate datasets array in place before idle callback runs so canvas is present but datasets is empty in effect
		datasets.length = 0;

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		// mockChart should not have been called because datasets was empty in effect
		expect(mockChart).not.toHaveBeenCalled();
	});

	it('handles early return branches when labels are empty or dataset updates rebuild chart', async () => {
		const datasets = [{ backgroundColor: ['red'], data: [10], label: 'Set 1' }];
		const labels = ['A'];

		// Case 1: Empty labels when canvas ref is attached during mount effect
		render(
			<PieChart
				datasets={datasets}
				emptyStateMessage="No data"
				labels={labels}
			/>,
		);

		// Mutate labels in place before idle callback triggers
		labels.length = 0;

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(mockChart).not.toHaveBeenCalled();

		// Case 2: Re-render component with new datasets destroys old instance and builds new chart
		labels.push('A');

		const { rerender: rerenderChart } = render(
			<PieChart
				datasets={datasets}
				emptyStateMessage="No data"
				labels={labels}
			/>,
		);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(mockChart).toHaveBeenCalledTimes(1);

		rerenderChart(
			<PieChart
				datasets={[{ backgroundColor: ['blue'], data: [20], label: 'Set 2' }]}
				emptyStateMessage="No data"
				labels={labels}
			/>,
		);

		expect(mockDestroy).toHaveBeenCalledTimes(1);
		expect(mockChart).toHaveBeenCalledTimes(2);
	});
});
