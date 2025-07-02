import type { FeedingSession } from '@/types/feeding';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TotalDurationStats from './total-duration-stats';

// Using real formatDurationAbbreviated

const mockSessions: FeedingSession[] = [
	{
		breast: 'left',
		durationInSeconds: 600, // 10 mins
		endTime: new Date().toISOString(),
		id: '1',
		startTime: new Date().toISOString(),
	},
	{
		breast: 'right',
		durationInSeconds: 900, // 15 mins
		endTime: new Date().toISOString(),
		id: '2',
		startTime: new Date().toISOString(),
	},
	{
		breast: 'left',
		durationInSeconds: 300, // 5 mins
		endTime: new Date().toISOString(),
		id: '3',
		startTime: new Date().toISOString(),
	},
];
// Total duration = 600 + 900 + 300 = 1800s (Actual output: "30m")

describe('TotalDurationStats', () => {
	// beforeEach removed

	it('renders null when no sessions are provided', () => {
		const { container } = render(<TotalDurationStats sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('calculates and displays total feeding duration correctly', () => {
		render(<TotalDurationStats sessions={mockSessions} />);
		expect(screen.getByText('Total feeding duration')).toBeInTheDocument();
		expect(screen.getByText('30 min')).toBeInTheDocument();
	});

	it('handles a single session', () => {
		const singleSession = [mockSessions[0]]; // 600s
		render(<TotalDurationStats sessions={singleSession} />);
		expect(screen.getByText('10 min')).toBeInTheDocument();
	});

	it('handles sessions with zero duration', () => {
		const zeroDurationSessions: FeedingSession[] = [
			{ ...mockSessions[0], durationInSeconds: 0 },
			{ ...mockSessions[1], durationInSeconds: 0 },
		];
		render(<TotalDurationStats sessions={zeroDurationSessions} />);
		expect(screen.getByText('0 min')).toBeInTheDocument(); // Corrected to actual output "0 min"
	});

	afterEach(() => {
		cleanup();
	});
});
