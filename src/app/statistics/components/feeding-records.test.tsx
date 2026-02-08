import type { FeedingSession } from '@/types/feeding';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeedingRecords from './feeding-records';

const mockSessions: FeedingSession[] = [
	{
		breast: 'left',
		durationInSeconds: 600,
		endTime: '2024-01-01T10:10:00Z',
		id: '1',
		startTime: '2024-01-01T10:00:00Z', // Day 1: 10min
	},
	{
		breast: 'right',
		durationInSeconds: 900,
		endTime: '2024-01-01T14:15:00Z',
		id: '2',
		startTime: '2024-01-01T14:00:00Z', // Day 1: 15min. Total Day 1: 2 feedings, 25min
	},
	{
		breast: 'left',
		durationInSeconds: 300,
		endTime: '2024-01-02T08:05:00Z',
		id: '3',
		startTime: '2024-01-02T08:00:00Z', // Day 2: 5min. Total Day 2: 1 feeding, 5min
	},
	{
		breast: 'right',
		durationInSeconds: 1200,
		endTime: '2024-01-03T12:20:00Z',
		id: '4',
		startTime: '2024-01-03T12:00:00Z', // Day 3: 20min
	},
	{
		breast: 'left',
		durationInSeconds: 1200,
		endTime: '2024-01-03T18:20:00Z',
		id: '5',
		startTime: '2024-01-03T18:00:00Z', // Day 3: 20min. Total Day 3: 2 feedings, 40min
	},
];

describe('FeedingRecords', () => {
	it('renders null when no sessions are provided', () => {
		const { container } = render(<FeedingRecords sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('calculates and displays records correctly', () => {
		render(<FeedingRecords sessions={mockSessions} />);

		expect(screen.getByText('Most feedings in a day')).toBeInTheDocument();
		expect(screen.getByText('Fewest feedings in a day')).toBeInTheDocument();
		expect(screen.getByText('Longest feeding day')).toBeInTheDocument();
		expect(screen.getByText('Shortest feeding day')).toBeInTheDocument();

		// Values:
		// Most: 2
		// Fewest: 1
		// Longest: 40 min
		// Shortest: 5 min

		// We check for presence of these values. 2 appears once as most feedings.
		expect(screen.getByText('2')).toBeInTheDocument();
		expect(screen.getByText('1')).toBeInTheDocument();
		expect(screen.getByText('40 min')).toBeInTheDocument();
		expect(screen.getByText('5 min')).toBeInTheDocument();
	});
});
