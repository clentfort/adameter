import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
	createFeedingSession,
	createFeedingSessions,
} from '@/test-utils/factories/feeding-session';
import HeatMap from './heat-map';

const mockSessions = createFeedingSessions([
	{ breast: 'left', durationInSeconds: 540, startTime: '2024-01-01T00:00:00Z' },
	{
		breast: 'right',
		durationInSeconds: 540,
		startTime: '2024-01-01T00:05:00Z',
	},
	{ breast: 'left', durationInSeconds: 540, startTime: '2024-01-01T23:55:00Z' },
]);
describe('HeatMap', () => {
	it('renders null when no sessions are provided', () => {
		const { container } = render(<HeatMap sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});
	it('renders the heat map even with a single zero-duration session (maxCount > 0)', () => {
		const singleZeroDurationSession = [
			createFeedingSession({
				breast: 'left',
				durationInSeconds: 0,
				startTime: '2024-01-01T00:00:00Z',
			}),
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
			expect(intervalElementsContainer.children[287]).toHaveAttribute(
				'title',
				'23:55 Uhr: 1 Mahlzeit',
			);
		}
	});
	it('renders time markers and legend', () => {
		const { container } = render(<HeatMap sessions={mockSessions} />);
		const heatMapCard = container.firstChild as HTMLElement;
		expect(within(heatMapCard).getAllByText('00:00')[0]).toBeInTheDocument();
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
		const intervalElementsContainer = within(heatMapCard).getByTitle(
			'00:00 Uhr: 2 Mahlzeiten',
		).parentElement;
		expect(intervalElementsContainer).not.toBeNull();
		if (intervalElementsContainer) {
			expect(intervalElementsContainer.children[0]).toHaveClass(
				'bg-right-breast',
			);
			expect(intervalElementsContainer.children[1]).toHaveClass(
				'bg-right-breast',
			);
			expect(intervalElementsContainer.children[2]).toHaveClass(
				'bg-right-breast/45',
			);
			expect(intervalElementsContainer.children[3]).toHaveClass('bg-muted/60');
		}
	});
});
