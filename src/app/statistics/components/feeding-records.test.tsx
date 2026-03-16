import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectStatsCardPrimaryMetric } from '@/test-utils/assertions/stats-card';
import { createFeedingSessions } from '@/test-utils/factories/feeding-session';
import FeedingRecords from './feeding-records';

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
		durationInSeconds: 1200,
		startTime: '2024-01-03T12:00:00Z',
	},
	{
		breast: 'left',
		durationInSeconds: 1200,
		startTime: '2024-01-03T18:00:00Z',
	},
]);

describe('FeedingRecords', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders null when no sessions are provided', () => {
		const { container } = render(<FeedingRecords sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('calculates and displays records correctly', () => {
		vi.setSystemTime(new Date('2024-01-04T12:00:00Z'));
		const { container } = render(<FeedingRecords sessions={mockSessions} />);

		expect(screen.getByText('Most feedings in a day')).toBeInTheDocument();
		expect(screen.getByText('Fewest feedings in a day')).toBeInTheDocument();
		expect(screen.getByText('Longest feeding day')).toBeInTheDocument();
		expect(screen.getByText('Shortest feeding day')).toBeInTheDocument();

		expectStatsCardPrimaryMetric(container, 2);
		expectStatsCardPrimaryMetric(container, 1);
		expect(screen.getByText('40 min')).toBeInTheDocument();
		expect(screen.getByText('5 min')).toBeInTheDocument();
		expect(
			screen.getByText('Longest gap between feedings'),
		).toBeInTheDocument();
		// Gap between Jan 1 10:10 (end of 10min) and Jan 1 14:00 (start) = 3h 50m
		// Gap between Jan 1 14:15 (end of 15min) and Jan 2 08:00 (start) = ~17h 45m
		// Gap between Jan 2 08:05 (end of 5min) and Jan 3 12:00 (start) = ~27h 55m (Longest)
		expect(screen.getByText('27 h 55 min')).toBeInTheDocument();
	});

	it('excludes sessions from today', () => {
		vi.setSystemTime(new Date('2024-01-03T12:00:00Z'));
		render(<FeedingRecords sessions={mockSessions} />);

		// Jan 3rd has 2 feedings (40min). If excluded:
		// Most: 2 (from Jan 1st)
		// Fewest: 1 (from Jan 2nd)
		// Longest: 25 min (from Jan 1st)
		// Shortest: 5 min (from Jan 2nd)

		expect(screen.queryByText('40 min')).not.toBeInTheDocument();
		expect(screen.getByText('25 min')).toBeInTheDocument();
		expect(screen.getByText('5 min')).toBeInTheDocument();
	});
});
