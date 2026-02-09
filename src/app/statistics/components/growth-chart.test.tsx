import type { Event } from '@/types/event';
import type { GrowthMeasurement } from '@/types/growth';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLanguage } from '@/contexts/i18n-context';
import GrowthChart from './growth-chart';

// Mock i18n-context
vi.mock('@/contexts/i18n-context', () => ({
	useLanguage: vi.fn(),
}));

// Mock LineChart component
interface MockLineChartProps {
	backgroundColor: string;
	borderColor: string;
	data: Array<{ x: Date; y: number }>;
	datasetLabel: string;
	emptyStateMessage: string;
	events: Event[];
	title: string;
	xAxisLabel: string;
	yAxisLabel: string;
	yAxisUnit: string;
}

const mockLineChart = vi.fn();
vi.mock('@/components/charts/line-chart', () => ({
	default: (props: MockLineChartProps) => {
		mockLineChart(props);
		const titleString =
			typeof props.title === 'string' ? props.title : (props.title as string).toString();
		return (
			<div data-testid={`mock-line-chart-${titleString.toLowerCase()}`}>
				{props.title} Chart - Data Length: {props.data.length}
				{props.emptyStateMessage && props.data.length === 0
					? (props.emptyStateMessage as string).toString()
					: null}
			</div>
		);
	},
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

const mockEvents: Event[] = [
	{
		id: 'e1',
		// name: 'First Smile', // Removed name property
		// notes: '', // Removed notes property
		// timestamp: new Date('2024-01-10T00:00:00Z').toISOString(), // Removed timestamp property
		color: '#000000', // Added color property
		startDate: new Date('2024-01-10T00:00:00Z').toISOString(), // Added startDate property
		title: 'First Smile', // Added title property
		type: 'milestone' as Event['type'],
	},
];

describe('GrowthChart', () => {
	beforeEach(() => {
		mockLineChart.mockClear();
		(useLanguage as any).mockReturnValue({ locale: 'de_DE' }); // Default to metric for tests
	});

	it('renders no data message when no measurements are provided', () => {
		render(<GrowthChart events={[]} measurements={[]} />);
		expect(
			screen.getByText(
				'No measurements available. Add measurements to see the growth chart.',
			),
		).toBeInTheDocument();
	});

	it('renders titles for weight, height, and head circumference sections', () => {
		render(<GrowthChart events={[]} measurements={mockMeasurements} />);
		expect(screen.getByText('Weight (g)')).toBeInTheDocument();
		expect(screen.getByText('Height (cm)')).toBeInTheDocument();
		expect(screen.getByText('Head Circumference (cm)')).toBeInTheDocument();
	});

	it('passes sorted and filtered weight data to LineChart (Metric)', () => {
		(useLanguage as any).mockReturnValue({ locale: 'de_DE' });
		render(<GrowthChart events={mockEvents} measurements={mockMeasurements} />);
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
	});

	it('passes sorted and filtered weight data to LineChart (Imperial)', () => {
		(useLanguage as any).mockReturnValue({ locale: 'en_US' });
		render(<GrowthChart events={mockEvents} measurements={mockMeasurements} />);
		const weightChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Weight',
		);
		expect(weightChartCall).toBeDefined();
		if (!weightChartCall) return; // Type guard
		expect(weightChartCall[0].data.length).toBe(3);
		expect(weightChartCall[0].data[0].y).toBe(6.61); // 3000g -> 6.61 lbs
		expect(weightChartCall[0].data[1].y).toBe(7.05); // 3200g -> 7.05 lbs
		expect(weightChartCall[0].data[2].y).toBe(7.72); // 3500g -> 7.72 lbs
		expect(weightChartCall[0].datasetLabel.toString()).toBe('Weight');
		expect(weightChartCall[0].yAxisUnit).toBe('lb');
		expect(weightChartCall[0].events).toEqual(mockEvents);
		const { container } = render(
			<GrowthChart events={mockEvents} measurements={mockMeasurements} />,
		);
		const growthCard = container.firstChild as HTMLElement; // Assuming the card is the first child
		expect(
			within(growthCard).getByTestId('mock-line-chart-weight'),
		).toHaveTextContent('Weight Chart - Data Length: 3');
	});

	it('passes sorted and filtered height data to LineChart (Metric)', () => {
		(useLanguage as any).mockReturnValue({ locale: 'de_DE' });
		const { container } = render(
			<GrowthChart events={[]} measurements={mockMeasurements} />,
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

	it('passes sorted and filtered height data to LineChart (Imperial)', () => {
		(useLanguage as any).mockReturnValue({ locale: 'en_US' });
		render(<GrowthChart events={[]} measurements={mockMeasurements} />);
		const heightChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Height',
		);
		expect(heightChartCall).toBeDefined();
		if (!heightChartCall) return; // Type guard
		expect(heightChartCall[0].data.length).toBe(2);
		expect(heightChartCall[0].data[0].y).toBe(19.69); // 50cm -> 19.69 in
		expect(heightChartCall[0].data[1].y).toBe(20.47); // 52cm -> 20.47 in
		expect(heightChartCall[0].yAxisUnit).toBe('in');
	});

	it('passes sorted and filtered head circumference data to LineChart (Metric)', () => {
		(useLanguage as any).mockReturnValue({ locale: 'de_DE' });
		const { container } = render(
			<GrowthChart events={[]} measurements={mockMeasurements} />,
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

	it('passes sorted and filtered head circumference data to LineChart (Imperial)', () => {
		(useLanguage as any).mockReturnValue({ locale: 'en_US' });
		render(<GrowthChart events={[]} measurements={mockMeasurements} />);
		const headChartCall = mockLineChart.mock.calls.find(
			(call) => call[0].title.toString() === 'Head Circumference',
		);
		expect(headChartCall).toBeDefined();
		if (!headChartCall) return; // Type guard
		expect(headChartCall[0].data.length).toBe(2);
		expect(headChartCall[0].data[0].y).toBe(13.78); // 35cm -> 13.78 in
		expect(headChartCall[0].data[1].y).toBe(14.17); // 36cm -> 14.17 in
		expect(headChartCall[0].yAxisUnit).toBe('in');
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
			<GrowthChart events={[]} measurements={singleMeasurement} />,
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

	it('displays note about events when events are provided', () => {
		const { container } = render(
			<GrowthChart events={mockEvents} measurements={mockMeasurements} />,
		);
		const growthCard = container.firstChild as HTMLElement;
		expect(
			within(growthCard).getByText(
				'* Vertical lines indicate important events.',
			),
		).toBeInTheDocument();
	});

	it('does not display note about events when no events are provided', () => {
		const { container } = render(
			<GrowthChart events={[]} measurements={mockMeasurements} />,
		);
		const growthCard = container.firstChild as HTMLElement;
		expect(
			within(growthCard).queryByText(
				'* Vertical lines indicate important events.',
			),
		).not.toBeInTheDocument();
	});

	afterEach(() => {
		cleanup();
	});
});
