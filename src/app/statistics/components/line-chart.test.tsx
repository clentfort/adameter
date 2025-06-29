import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import { render, screen } from '@testing-library/react';
// Chart will be mocked
import Chart from 'chart.js/auto'; // This import is fine, as vi.mock will handle it

import { fbt } from 'fbtee';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'; // Added afterEach
import { cleanup } from '@testing-library/react'; // Added cleanup

// Import the component to test
import LineChart from './line-chart';

vi.mock('chart.js/auto', () => {
	const mockChartInstance = {
		destroy: vi.fn(),
		update: vi.fn(),
	};
	const mockChart = vi.fn(() => mockChartInstance);
	// @ts-expect-error - Mocking Chart constructor
	mockChart.getChart = vi.fn();
	// @ts-expect-error - Mocking Chart constructor
	mockChart.register = vi.fn();
	return { default: mockChart };
});

const mockChartDataFn = () => [
	{
		x: new Date('2023-01-01T00:00:00.000Z'),
		y: 3000,
	},
	{
		x: new Date('2023-01-08T00:00:00.000Z'),
		y: 3200,
	},
];

const mockEventsFn = (): Event[] => [];

const defaultPropsFn = () => ({
	backgroundColor: 'rgba(0,0,255,0.1)',
	borderColor: 'blue',
	chartData: mockChartDataFn(),
	datasetLabel: 'Weight (g)',
	events: mockEventsFn(),
	title: <fbt desc="Test Chart Title">Test Chart</fbt>,
	xAxisLabel: 'Date',
	noDataMessageLabel: 'Weight',
});

describe('LineChart', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup(); // Cleanup after each test
	});

	it('renders the chart title', () => {
		render(<LineChart {...defaultPropsFn()} />);
		expect(screen.getByText('Test Chart')).toBeInTheDocument();
	});

	it('renders the canvas and initializes Chart when chartData is available', () => {
		const { container } = render(<LineChart {...defaultPropsFn()} />);
		const canvasElement = container.querySelector('canvas');
		expect(canvasElement).toBeInTheDocument();
		expect(Chart).toHaveBeenCalled();
		const chartArgs = (Chart as vi.Mock).mock.calls[0];
		expect(chartArgs[1].data.datasets[0].label).toBe('Weight (g)');
		expect(chartArgs[1].data.datasets[0].data.length).toBe(2);
		expect(chartArgs[1].options.scales.x.title.text).toBe('Date');
		expect(chartArgs[1].options.scales.y.title.text).toBe('Weight (g)');
	});

	it('renders "no data" message when chartData array is empty', () => {
		const props = { ...defaultPropsFn(), chartData: [] };
		const { container } = render(<LineChart {...props} />);
		expect(screen.getByText('No weight data available.')).toBeInTheDocument();
		expect(container.querySelector('canvas')).not.toBeInTheDocument();
		expect(Chart).not.toHaveBeenCalled();
	});

	it('correctly passes event data to the chart', () => {
		const eventsWithData: Event[] = [
			{
				color: '#ff0000',
				endDate: '2023-01-05T00:00:00.000Z',
				id: 'event1',
				startDate: '2023-01-03T00:00:00.000Z',
				title: 'Test Event',
				type: 'period', // Added type to satisfy Event interface
				userId: 'user1',
			},
		];
		const props = { ...defaultPropsFn(), events: eventsWithData };
		render(<LineChart {...props} />);
		expect(Chart).toHaveBeenCalled();
		const chartArgs = (Chart as vi.Mock).mock.calls[0];
		const eventLinesPlugin = chartArgs[1].plugins.find(
			(p: any) => p.id === 'eventLines',
		);
		expect(eventLinesPlugin).toBeDefined();
	});
});
