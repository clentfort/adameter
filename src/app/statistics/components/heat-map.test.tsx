import type { FeedingSession } from '@/types/feeding';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HeatMap from './heat-map';

const mockSessions: FeedingSession[] = [
	// Session 1: 00:00 - 00:09 (Intervals 0, 1)
	{
		breast: 'left',
		durationInSeconds: 540,
		endTime: new Date('2024-01-01T00:09:00Z').toISOString(), // Spans 2 5-min intervals (00:00, 00:05)
		id: '1',
		startTime: new Date('2024-01-01T00:00:00Z').toISOString(),
	},
	// Session 2: 00:05 - 00:14 (Intervals 1, 2)
	{
		breast: 'right',
		durationInSeconds: 540,
		endTime: new Date('2024-01-01T00:14:00Z').toISOString(), // Spans 2 5-min intervals (00:05, 00:10)
		id: '2',
		startTime: new Date('2024-01-01T00:05:00Z').toISOString(),
	},
	// Session 3: 23:55 - 00:04 (Intervals 287 (day 1), 0 (day 2))
	{
		breast: 'left',
		durationInSeconds: 540,
		endTime: new Date('2024-01-02T00:04:00Z').toISOString(), // Spans 2 5-min intervals (23:55 day 1, 00:00 day 2)
		id: '3',
		startTime: new Date('2024-01-01T23:55:00Z').toISOString(),
	},
];

describe('HeatMap', () => {
	it('renders null when no sessions are provided', () => {
		const { container } = render(<HeatMap sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('renders the heat map even with a single zero-duration session (maxCount > 0)', () => {
		const singleZeroDurationSession: FeedingSession[] = [
			{
				breast: 'left',
				durationInSeconds: 0,
				endTime: new Date('2024-01-01T00:00:00Z').toISOString(), // Falls into 00:00 interval
				id: '1',
				startTime: new Date('2024-01-01T00:00:00Z').toISOString(),
			},
		];
		const { container } = render(
			<HeatMap sessions={singleZeroDurationSession} />,
		);
		const heatMapCard = container.firstChild as HTMLElement;
		expect(heatMapCard).not.toBeNull();
		expect(
			within(heatMapCard).getByText('Daily Feeding Distribution'),
		).toBeInTheDocument();
	});

	it('renders the heat map with correct number of interval divs', () => {
		const { container } = render(<HeatMap sessions={mockSessions} />);
		const heatMapCard = container.firstChild as HTMLElement;
		expect(
			within(heatMapCard).getAllByText('Daily Feeding Distribution')[0],
		).toBeInTheDocument();

		// Find the heat map container more robustly
		const intervalElementsContainer = within(heatMapCard).getByTitle(
			'00:00 Uhr: 2 Mahlzeiten',
		).parentElement;

		expect(intervalElementsContainer).not.toBeNull();
		if (intervalElementsContainer) {
			expect(intervalElementsContainer.children.length).toBe(288); // 288 5-minute intervals
		}
	});

	it('assigns correct titles (tooltips) to interval divs reflecting counts', () => {
		const { container } = render(<HeatMap sessions={mockSessions} />);
		const heatMapCard = container.firstChild as HTMLElement;
		// Interval 0 (00:00): Sessions 1 and 3 (midnight span) -> count 2
		// Interval 1 (00:05): Sessions 1 and 2 -> count 2
		// Interval 2 (00:10): Session 2 -> count 1
		// Interval 287 (23:55): Session 3 -> count 1

		const intervalElementsContainer = within(heatMapCard).getByTitle(
			'00:00 Uhr: 2 Mahlzeiten',
		).parentElement;

		expect(intervalElementsContainer).not.toBeNull();
		if (intervalElementsContainer) {
			expect(intervalElementsContainer.children[0]).toHaveAttribute(
				'title',
				'00:00 Uhr: 2 Mahlzeiten',
			);
			expect(intervalElementsContainer.children[1]).toHaveAttribute(
				'title',
				'00:05 Uhr: 2 Mahlzeiten',
			);
			expect(intervalElementsContainer.children[2]).toHaveAttribute(
				'title',
				'00:10 Uhr: 1 Mahlzeit',
			);
			// ... other intervals would be "0 Mahlzeiten" or "1 Mahlzeit"
			expect(intervalElementsContainer.children[287]).toHaveAttribute(
				'title',
				'23:55 Uhr: 1 Mahlzeit',
			);
		}
	});

	it('renders time markers and legend', () => {
		const { container } = render(<HeatMap sessions={mockSessions} />);
		const heatMapCard = container.firstChild as HTMLElement;

		// Use getAllByText for time markers as they might appear in tooltips too
		expect(within(heatMapCard).getAllByText('00:00')[0]).toBeInTheDocument(); // Get the first instance, assuming it's the marker
		expect(within(heatMapCard).getByText('03:00')).toBeInTheDocument();
		expect(within(heatMapCard).getByText('06:00')).toBeInTheDocument();
		expect(within(heatMapCard).getByText('09:00')).toBeInTheDocument();
		expect(within(heatMapCard).getByText('12:00')).toBeInTheDocument();
		expect(within(heatMapCard).getByText('15:00')).toBeInTheDocument();
		expect(within(heatMapCard).getByText('18:00')).toBeInTheDocument();
		expect(within(heatMapCard).getByText('21:00')).toBeInTheDocument();
		expect(within(heatMapCard).getByText('24:00')).toBeInTheDocument();

		expect(
			within(heatMapCard).getByText('Very High Activity'),
		).toBeInTheDocument();
		expect(within(heatMapCard).getByText('High Activity')).toBeInTheDocument();
		expect(
			within(heatMapCard).getByText('Medium Activity'),
		).toBeInTheDocument();
		expect(within(heatMapCard).getByText('Low Activity')).toBeInTheDocument();
		expect(
			within(heatMapCard).getByText('Very Low Activity'),
		).toBeInTheDocument();
	});

	it('applies different background colors based on intensity', () => {
		const { container } = render(<HeatMap sessions={mockSessions} />);
		const heatMapCard = container.firstChild as HTMLElement;

		// maxCount will be 2 for mockSessions
		// Interval 0 (count 2): intensity 1.0 -> bg-pink-600
		// Interval 2 (count 1): intensity 0.5 -> bg-purple-400 (0.4 <= intensity < 0.6)
		// Interval 3 (count 0): intensity 0 -> bg-gray-100

		const intervalElementsContainer = within(heatMapCard).getByTitle(
			'00:00 Uhr: 2 Mahlzeiten',
		).parentElement;

		expect(intervalElementsContainer).not.toBeNull();
		if (intervalElementsContainer) {
			expect(intervalElementsContainer.children[0]).toHaveClass('bg-pink-600');
			expect(intervalElementsContainer.children[1]).toHaveClass('bg-pink-600'); // count 2
			expect(intervalElementsContainer.children[2]).toHaveClass(
				'bg-purple-400',
			); // count 1
			expect(intervalElementsContainer.children[3]).toHaveClass('bg-gray-100'); // count 0
		}
	});

	afterEach(() => {
		cleanup();
	});
});
