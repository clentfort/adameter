import type { FeedingSession } from '@/types/feeding';
import { cleanup, render, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import TimeBetweenStats from './time-between-stats';

// We are using the real formatDurationAbbreviated, so no need to import it here for mocking
// import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';

// fbt mock removed
// formatDurationAbbreviated mock removed - ensure no vi.mock for this utility is present

const mockSessions: FeedingSession[] = [
	{
		// Session 1
		breast: 'left',
		durationInSeconds: 600,
		endTime: new Date('2024-01-01T10:10:00Z').toISOString(),
		id: '1',
		startTime: new Date('2024-01-01T10:00:00Z').toISOString(), // Oldest
	},
	{
		// Session 2: Diff from S1 = 2 hours (7200s)
		breast: 'right',
		durationInSeconds: 900,
		endTime: new Date('2024-01-01T12:15:00Z').toISOString(),
		id: '2',
		startTime: new Date('2024-01-01T12:00:00Z').toISOString(),
	},
	{
		// Session 3: Diff from S2 = 3 hours (10800s)
		breast: 'left',
		durationInSeconds: 300,
		endTime: new Date('2024-01-01T15:05:00Z').toISOString(),
		id: '3',
		startTime: new Date('2024-01-01T15:00:00Z').toISOString(), // Newest
	},
];
// Total time between = 7200s + 10800s = 18000s
// Count = 2
// Avg time between = 18000s / 2 = 9000s (2h 30m 0s by the real function)

describe('TimeBetweenStats', () => {
	// beforeEach can be removed if vi.clearAllMocks() is the only thing it did
	// and vi is no longer used. For now, keeping it empty or removing it.
	// beforeEach(() => {
	// });

	it('renders null when zero or one session is provided', () => {
		const { container: zeroContainer } = render(
			<TimeBetweenStats sessions={[]} />,
		);
		expect(zeroContainer.firstChild).toBeNull();

		const { container: oneContainer } = render(
			<TimeBetweenStats sessions={[mockSessions[0]]} />,
		);
		expect(oneContainer.firstChild).toBeNull();
	});

	it('calculates and displays average time between feedings correctly', () => {
		const { container } = render(<TimeBetweenStats sessions={mockSessions} />);
		const statsCard = container.firstChild as HTMLElement;
		expect(
			within(statsCard).getByText('Time Between Feedings'),
		).toBeInTheDocument();
		expect(within(statsCard).getByText('2 h 30 min')).toBeInTheDocument();
	});

	it('handles sessions with identical start times (0s difference)', () => {
		const sessionsWithOverlap: FeedingSession[] = [
			mockSessions[0], // 10:00
			{ ...mockSessions[1], startTime: mockSessions[0].startTime }, // Also 10:00
			mockSessions[2], // 15:00. Diff from 10:00 = 5 hours (18000s)
		];
		const { container } = render(
			<TimeBetweenStats sessions={sessionsWithOverlap} />,
		);
		const statsCard = container.firstChild as HTMLElement;
		expect(within(statsCard).getByText('5 h')).toBeInTheDocument();
	});

	it('correctly sorts sessions by start time before calculating', () => {
		const unsortedSessions: FeedingSession[] = [
			mockSessions[1], // 12:00
			mockSessions[2], // 15:00
			mockSessions[0], // 10:00
		];
		const { container } = render(
			<TimeBetweenStats sessions={unsortedSessions} />,
		);
		const statsCard = container.firstChild as HTMLElement;
		// This test might still be tricky if "2 h 30 min" is rendered by the first test case
		// and cleanup isn't perfect or if this test rerenders it identically.
		// The key is that THIS render call produces "2 h 30 min".
		expect(within(statsCard).getByText('2 h 30 min')).toBeInTheDocument();
	});

	it('handles only two sessions', () => {
		const twoSessions: FeedingSession[] = [
			mockSessions[0], // 10:00
			mockSessions[1], // 12:00. Diff = 7200s
		];
		const { container } = render(<TimeBetweenStats sessions={twoSessions} />);
		const statsCard = container.firstChild as HTMLElement;
		expect(within(statsCard).getByText('2 h')).toBeInTheDocument();
	});

	afterEach(() => {
		cleanup();
	});
});
