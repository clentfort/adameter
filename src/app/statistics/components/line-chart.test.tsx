import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import { render, screen } from '@testing-library/react';
// Chart will be mocked
import Chart from 'chart.js/auto'; // This import is fine, as vi.mock will handle it

// fbt is used in defaultProps, ensure it's available or transformed by babel-plugin-fbtee
// Added fbt import
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import the component to test
import LineChart from './line-chart'; // Corrected import

// No longer mocking '../hooks/use-single-growth-chart' as logic is internal.
// Instead, we may need to mock Chart.js itself if we want to inspect chart creation params.
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

// fbt will not be mocked, relying on actual fbtee behavior or babel transform.

const mockMeasurementsFn = (): GrowthMeasurement[] => [
	{
		date: '2023-01-01T00:00:00.000Z',
		id: '1',
		userId: 'user1',
		weight: 3000,
	},
	{
		date: '2023-01-08T00:00:00.000Z',
		id: '2',
		userId: 'user1',
		weight: 3200,
	},
];

const mockEventsFn = (): Event[] => [];

const defaultPropsFn = () => ({
	backgroundColor: 'rgba(0,0,255,0.1)',
	borderColor: 'blue',
	dataKey: 'weight' as keyof GrowthMeasurement,
	events: mockEventsFn(),
	label: 'Weight',
	measurements: mockMeasurementsFn(),
	title: <fbt desc="Test Chart Title">Test Chart</fbt>,
	unit: 'g',
});

describe('LineChart', () => { // Updated describe
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the chart title', () => {
		render(<LineChart {...defaultPropsFn()} />); // Updated component name
		expect(screen.getByText('Test Chart')).toBeInTheDocument();
	});

	it('renders the canvas and initializes Chart when data is available', () => {
		const { container } = render(<LineChart {...defaultPropsFn()} />); // Updated component name
		const canvasElement = container.querySelector('canvas');
		expect(canvasElement).toBeInTheDocument();
		expect(Chart).toHaveBeenCalled();
		const chartArgs = (Chart as vi.Mock).mock.calls[0]; // vi.Mock for typed mock
		expect(chartArgs[1].data.datasets[0].label).toBe('Weight (g)');
		expect(chartArgs[1].data.datasets[0].data.length).toBe(2);
	});

	it('renders "no data" message when measurements for the dataKey are undefined', () => {
		const props = {
			...defaultPropsFn(),
			measurements: mockMeasurementsFn().map((m) => ({
				...m,
				weight: undefined,
			})),
		};
		const { container } = render(<LineChart {...props} />); // Updated component name
		expect(screen.getByText('No weight data available.')).toBeInTheDocument();
		expect(container.querySelector('canvas')).not.toBeInTheDocument();
		expect(Chart).not.toHaveBeenCalled();
	});

	it('renders "no data" message when measurements for the dataKey are null', () => {
		const props = {
			...defaultPropsFn(),
			measurements: mockMeasurementsFn().map((m) => ({
				...m,
				weight: null as number | null | undefined,
			})),
		};
		const { container } = render(<LineChart {...props} />); // Updated component name
		expect(screen.getByText('No weight data available.')).toBeInTheDocument();
		expect(container.querySelector('canvas')).not.toBeInTheDocument();
		expect(Chart).not.toHaveBeenCalled();
	});

	it('renders "no data" message when measurements array is empty', () => {
		const props = { ...defaultPropsFn(), measurements: [] };
		const { container } = render(<LineChart {...props} />); // Updated component name
		expect(screen.getByText('No weight data available.')).toBeInTheDocument();
		expect(container.querySelector('canvas')).not.toBeInTheDocument();
		expect(Chart).not.toHaveBeenCalled();
	});

	it('correctly determines hasData for different dataKeys and initializes chart', () => {
		const propsWithHeight = {
			...defaultPropsFn(),
			dataKey: 'height' as keyof GrowthMeasurement,
			label: 'Height',
			measurements: [
				{
					date: '2023-01-01',
					height: 50,
					id: '1',
					userId: 'user1',
				} as GrowthMeasurement,
				{
					date: '2023-01-01',
					id: '2',
					userId: 'user1',
					weight: 3000,
				} as GrowthMeasurement,
			],
		};
		const { container } = render(<LineChart {...propsWithHeight} />); // Updated component name
		expect(container.querySelector('canvas')).toBeInTheDocument();
		expect(Chart).toHaveBeenCalledTimes(1);
		const chartArgsHeight = (Chart as vi.Mock).mock.calls[0];
		expect(chartArgsHeight[1].data.datasets[0].label).toBe('Height (cm)');
		expect(chartArgsHeight[1].data.datasets[0].data.length).toBe(1);

		vi.clearAllMocks();

		const propsWithNoHeightData = {
			...propsWithHeight,
			measurements: [
				{
					date: '2023-01-01',
					id: '2',
					userId: 'user1',
					weight: 3000,
				} as GrowthMeasurement,
			],
		};
		const { container: containerNoHeight } = render(
			<LineChart {...propsWithNoHeightData} />, // Updated component name
		);
		expect(screen.getByText('No height data available.')).toBeInTheDocument();
		expect(containerNoHeight.querySelector('canvas')).not.toBeInTheDocument();
		// Chart mock should not have been called again since vi.clearAllMocks() and then no data render
		expect(Chart).not.toHaveBeenCalled();
	});
});
