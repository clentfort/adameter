import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
	createFeedingSession,
	createFeedingSessions,
} from '@/test-utils/factories/feeding-session';
import FeedingsPerDayStats from './feedings-per-day-stats';

const mockSessions = createFeedingSessions([
	{ breast: 'left', durationInSeconds: 600, startTime: '2024-01-01T10:00:00Z' },
	{
		breast: 'right',
		durationInSeconds: 900,
		startTime: '2024-01-01T14:00:00Z',
	},
	{ breast: 'left', durationInSeconds: 300, startTime: '2024-01-02T08:00:00Z' },
	{
		breast: 'right',
		durationInSeconds: 600,
		startTime: '2024-01-03T12:00:00Z',
	},
	{ breast: 'left', durationInSeconds: 300, startTime: '2024-01-03T18:00:00Z' },
]);
describe('FeedingsPerDayStats', () => {
	it('renders null when no sessions are provided', () => {
		const { container } = render(<FeedingsPerDayStats sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});
	it('calculates and displays average feedings per day correctly', () => {
		render(<FeedingsPerDayStats sessions={mockSessions} />);
		expect(screen.getByText('Feedings Per Day')).toBeInTheDocument();
		expect(screen.getByText('1.7')).toBeInTheDocument(); // 5 sessions / 3 days
	});
	it('handles sessions all on the same day', () => {
		const sameDaySessions = createFeedingSessions([
			{
				breast: 'left',
				durationInSeconds: 600,
				startTime: '2024-01-01T10:00:00Z',
			},
			{
				breast: 'right',
				durationInSeconds: 900,
				startTime: '2024-01-01T14:00:00Z',
			},
		]);
		render(<FeedingsPerDayStats sessions={sameDaySessions} />);
		expect(screen.getByText('2.0')).toBeInTheDocument();
	});
	it('handles a single session', () => {
		const singleSession = [
			createFeedingSession({
				breast: 'left',
				durationInSeconds: 600,
				startTime: '2024-01-01T10:00:00Z',
			}),
		];
		render(<FeedingsPerDayStats sessions={singleSession} />);
		expect(screen.getByText('1.0')).toBeInTheDocument();
	});
});
