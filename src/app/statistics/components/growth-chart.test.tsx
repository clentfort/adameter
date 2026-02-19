import type { GrowthMeasurement } from '@/types/growth';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GrowthChart from './growth-chart';

// Mock LineChart component
interface MockLineChartProps {
	backgroundColor: string;
	borderColor: string;
	data: Array<{ x: Date; y: number }>;
	datasetLabel: string;
	emptyStateMessage: string;
	forecastDate?: Date;
	rangeData?: Array<{ x: Date; yMax: number; yMin: number }>;
	title: string;
	xAxisLabel: string;
	yAxisLabel: string;
	yAxisUnit: string;
}

const mockLineChart = vi.fn();
vi.mock('@/components/charts/line-chart', () => ({
	default: (props: MockLineChartProps) => {
		mockLineChart(props);
		const titleString = String(props.title);
		return (
			<div data-testid={`mock-line-chart-${titleString.toLowerCase()}`}>
				{props.title} Chart - Data Length: {props.data.length}
				{props.emptyStateMessage && props.data.length === 0
					? String(props.emptyStateMessage)
					: null}
			</div>
		);
	},
}));

vi.mock('@/hooks/use-profile', () => ({
	useProfile: () => [{ dob: '2024-01-01', sex: 'boy' }, vi.fn()],
}));

vi.mock('@/utils/growth-standards', () => ({
	calculateValue: vi.fn((L, M, S, Z) => M * (1 + L * S * Z)),
	getGrowthRange: vi.fn(async () => ({ max: 4000, min: 2000 })),
	getGrowthTable: vi.fn(async () => ({
		index: 0,
		table: [{ age: 0, L: 1, M: 1, S: 1 }],
	})),
	lookupLms: vi.fn(() => ({ age: 0, L: 1, M: 1, S: 1 })),
	Z_3RD: -1.88,
	Z_97TH: 1.88,
}));

const mockMeasurements: GrowthMeasurement[] = [
	{
		date: new Date('2024-01-01T00:00:00Z').toISOString(),
		headCircumference: 35,
		height: 50,
		id: '1',
		weight: 3000,
	},
	{
		date: new Date('2024-01-15T00:00:00Z').toISOString(),
		height: 52,
		id: '2',
		weight: 3500,
		// No head circumference for this one
	},
	{
		date: new Date('2024-01-08T00:00:00Z').toISOString(), // Out of order date
		id: '3',
		weight: 3200,
		// No height
		headCircumference: 36,
	},
];

describe('GrowthChart', () => {
	beforeEach(() => {
		mockLineChart.mockClear();
	});

	it('renders no data message when no measurements are provided', () => {
		render(<GrowthChart measurements={[]} />);
		expect(
			screen.getByText(
				'No measurements available. Add measurements to see the growth chart.',
			),
		).toBeInTheDocument();
	});

	it('renders titles for weight, height, and head circumference sections', () => {
		render(<GrowthChart measurements={mockMeasurements} />);
		expect(screen.getByText('Weight (g)')).toBeInTheDocument();
		expect(screen.getByText('Height (cm)')).toBeInTheDocument();
		expect(screen.getByText('Head Circumference (cm)')).toBeInTheDocument();
	});

	it('passes sorted and filtered weight data to LineChart', () => {
		const { container } = render(
			<GrowthChart measurements={mockMeasurements} />,
		);
		const weightChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Weight',
		);
		expect(weightChartCall).toBeDefined();
		if (!weightChartCall) return; // Type guard
		expect(weightChartCall[0].data.length).toBe(3);
		expect(weightChartCall[0].data[0].y).toBe(3000); // 2024-01-01
		expect(weightChartCall[0].data[1].y).toBe(3200); // 2024-01-08
		expect(weightChartCall[0].data[2].y).toBe(3500); // 2024-01-15
		expect(weightChartCall[0].datasetLabel.toString()).toBe('Weight');
		expect(weightChartCall[0].yAxisUnit).toBe('g');

		const growthCard = container.firstChild as HTMLElement;
		expect(
			within(growthCard).getByTestId('mock-line-chart-weight'),
		).toHaveTextContent('Weight Chart - Data Length: 3');
	});

	it('passes sorted and filtered height data to LineChart', () => {
		const { container } = render(
			<GrowthChart measurements={mockMeasurements} />,
		);
		const growthCard = container.firstChild as HTMLElement;
		const heightChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Height',
		);
		expect(heightChartCall).toBeDefined();
		if (!heightChartCall) return; // Type guard
		expect(heightChartCall[0].data.length).toBe(2);
		expect(heightChartCall[0].data[0].y).toBe(50); // 2024-01-01
		expect(heightChartCall[0].data[1].y).toBe(52); // 2024-01-15
		expect(heightChartCall[0].datasetLabel.toString()).toBe('Height');
		expect(heightChartCall[0].yAxisUnit).toBe('cm');
		expect(
			within(growthCard).getByTestId('mock-line-chart-height'),
		).toHaveTextContent('Height Chart - Data Length: 2');
	});

	it('passes sorted and filtered head circumference data to LineChart', () => {
		const { container } = render(
			<GrowthChart measurements={mockMeasurements} />,
		);
		const growthCard = container.firstChild as HTMLElement;
		const headChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Head Circumference',
		);
		expect(headChartCall).toBeDefined();
		if (!headChartCall) return; // Type guard
		expect(headChartCall[0].data.length).toBe(2);
		expect(headChartCall[0].data[0].y).toBe(35); // 2024-01-01
		expect(headChartCall[0].data[1].y).toBe(36); // 2024-01-08
		expect(headChartCall[0].datasetLabel.toString()).toBe('Head Circumference');
		expect(headChartCall[0].yAxisUnit).toBe('cm');
		expect(
			within(growthCard).getByTestId('mock-line-chart-head circumference'),
		).toHaveTextContent('Head Circumference Chart - Data Length: 2');
	});

	it('displays empty state message for charts with no data', () => {
		const singleMeasurement: GrowthMeasurement[] = [
			{
				date: new Date('2024-01-01T00:00:00Z').toISOString(),
				id: '1',
				// No weight, height, or headC data
			},
		];
		const { container } = render(
			<GrowthChart measurements={singleMeasurement} />,
		);
		const growthCard = container.firstChild as HTMLElement;

		const weightChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Weight',
		);
		expect(weightChartCall).toBeDefined();
		if (!weightChartCall) return; // Type guard
		expect(weightChartCall[0].data.length).toBe(0);
		expect(
			within(growthCard).getByTestId('mock-line-chart-weight'),
		).toHaveTextContent('No data available.');

		const heightChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Height',
		);
		expect(heightChartCall).toBeDefined();
		if (!heightChartCall) return; // Type guard
		expect(heightChartCall[0].data.length).toBe(0);
		expect(
			within(growthCard).getByTestId('mock-line-chart-height'),
		).toHaveTextContent('No data available.');

		const headChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Head Circumference',
		);
		expect(headChartCall).toBeDefined();
		if (!headChartCall) return; // Type guard
		expect(headChartCall[0].data.length).toBe(0);
		expect(
			within(growthCard).getByTestId('mock-line-chart-head circumference'),
		).toHaveTextContent('No data available.');
	});

	afterEach(() => {
		cleanup();
	});
});
