import { cleanup, render, screen } from '@testing-library/react';
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
	options: {},
	update: mockUpdate,
};
const mockChart = vi.fn((...args: unknown[]) => mockChartInstance);

vi.mock('chart.js', () => ({
	CategoryScale: vi.fn(),
	Chart: class Chart {
		static register = vi.fn();
		constructor(...args: unknown[]) {
			return mockChart(...args);
		}
	},
	Filler: vi.fn(),
	Legend: vi.fn(),
	LinearScale: vi.fn(),
	LineController: vi.fn(),
	LineElement: vi.fn(),
	PointElement: vi.fn(),
	TimeScale: vi.fn(),
	Title: vi.fn(),
	Tooltip: vi.fn(),
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

	it('should render and initialize chart with minimal props', () => {
		const date = new Date();
		const mockData = [{ x: date, y: 10 }];
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

		expect(screen.getByRole('graphics-document')).toBeInTheDocument();
		expect(mockChart).toHaveBeenCalledTimes(1);
		expect(mockChart).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({
				data: expect.objectContaining({
					datasets: expect.arrayContaining([
						expect.objectContaining({
							data: [{ x: date.getTime(), y: 10 }],
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

	it('should destroy chart instance on unmount', () => {
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
});
