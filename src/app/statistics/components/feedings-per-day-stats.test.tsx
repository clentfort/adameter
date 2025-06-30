import type { FeedingSession } from '@/types/feeding';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FeedingsPerDayStats from './feedings-per-day-stats';

const mockSessions: FeedingSession[] = [
	{
		breast: 'left',
		durationInSeconds: 600,
		endTime: new Date('2024-01-01T10:10:00Z').toISOString(),
		id: '1',
		notes: '',
		startTime: new Date('2024-01-01T10:00:00Z').toISOString(), // Day 1
	},
	{
		breast: 'right',
		durationInSeconds: 900,
		endTime: new Date('2024-01-01T14:15:00Z').toISOString(),
		id: '2',
		notes: '',
		startTime: new Date('2024-01-01T14:00:00Z').toISOString(), // Day 1
	},
	{
		breast: 'left',
		durationInSeconds: 300,
		endTime: new Date('2024-01-02T08:05:00Z').toISOString(),
		id: '3',
		notes: '',
		startTime: new Date('2024-01-02T08:00:00Z').toISOString(), // Day 2
	},
	{
		breast: 'right',
		durationInSeconds: 600,
		endTime: new Date('2024-01-03T12:10:00Z').toISOString(),
		id: '4',
		notes: '',
		startTime: new Date('2024-01-03T12:00:00Z').toISOString(), // Day 3
	},
	{
		breast: 'left',
		durationInSeconds: 300,
		endTime: new Date('2024-01-03T18:05:00Z').toISOString(),
		id: '5',
		notes: '',
		startTime: new Date('2024-01-03T18:00:00Z').toISOString(), // Day 3
	},
]; // 5 sessions over 3 days. Day1: 2, Day2: 1, Day3: 2. Total 5. Avg = 5/3 = 1.666... -> 1.7

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
		const sameDaySessions: FeedingSession[] = [
			{
				breast: 'left',
				durationInSeconds: 600,
				endTime: new Date('2024-01-01T10:10:00Z').toISOString(),
				id: '1',
				notes: '',
				startTime: new Date('2024-01-01T10:00:00Z').toISOString(),
			},
			{
				breast: 'right',
				durationInSeconds: 900,
				endTime: new Date('2024-01-01T14:15:00Z').toISOString(),
				id: '2',
				notes: '',
				startTime: new Date('2024-01-01T14:00:00Z').toISOString(),
			},
		]; // 2 sessions / 1 day
		render(<FeedingsPerDayStats sessions={sameDaySessions} />);
		expect(screen.getByText('2.0')).toBeInTheDocument();
	});

	it('handles a single session', () => {
		const singleSession: FeedingSession[] = [
			{
				breast: 'left',
				durationInSeconds: 600,
				endTime: new Date('2024-01-01T10:10:00Z').toISOString(),
				id: '1',
				notes: '',
				startTime: new Date('2024-01-01T10:00:00Z').toISOString(),
			},
		]; // 1 session / 1 day
		render(<FeedingsPerDayStats sessions={singleSession} />);
		expect(screen.getByText('1.0')).toBeInTheDocument();
	});
});
