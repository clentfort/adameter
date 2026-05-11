import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PieChart from './pie-chart';

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
				display: true,
			},
			title: {
				display: true,
				text: '',
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
				title="Initial Title"
			/>,
		);

		// Wait for idle callback and useEffect
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(screen.getByRole('graphics-document')).toBeInTheDocument();
		expect(mockChart).toHaveBeenCalled();

		// 2. Update props to exercise the update useEffect
		const updatedDatasets = [
			{ backgroundColor: ['green'], data: [30], label: 'Set 2' },
		];
		const updatedLabels = ['C'];
		rerender(
			<PieChart
				datasets={updatedDatasets}
				emptyStateMessage="No data"
				hideLegend={true}
				labels={updatedLabels}
				title="Updated Title"
			/>,
		);

		expect(mockUpdate).toHaveBeenCalled();
		expect(mockChartInstance.data.labels).toEqual(updatedLabels);
		expect(mockChartInstance.data.datasets[0]).toMatchObject(
			updatedDatasets[0],
		);
		expect(mockChartInstance.options.plugins.title.text).toBe('Updated Title');
		expect(mockChartInstance.options.plugins.legend.display).toBe(false);

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

	it('should use default tooltip label formatter when none is provided', async () => {
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

		const chartConfig = mockChart.mock.calls.at(-1)![1] as {
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
		const labelCallback = chartConfig.options.plugins.tooltip.callbacks.label;

		// Test with label and value
		expect(labelCallback({ label: 'A', parsed: 10 })).toBe('A: 10');
		// Test without label
		expect(labelCallback({ label: '', parsed: 10 })).toBe('10');
		// Test without value
		expect(labelCallback({ label: 'A', parsed: null })).toBe('A: ');
	});
});
