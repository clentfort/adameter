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
});
