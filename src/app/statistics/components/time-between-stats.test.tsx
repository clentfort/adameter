import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFeedingSessions } from '@/test-utils/factories/feeding-session';
import TimeBetweenStats from './time-between-stats';

const mockSessions = createFeedingSessions([
	{ breast: 'left', durationInSeconds: 600, startTime: '2024-01-01T10:00:00Z' },
	{
		breast: 'right',
		durationInSeconds: 900,
		startTime: '2024-01-01T12:00:00Z',
	},
	{ breast: 'left', durationInSeconds: 300, startTime: '2024-01-01T15:00:00Z' },
]);
describe('TimeBetweenStats', () => {
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
		const sessionsWithOverlap = [
			mockSessions[0],
			{ ...mockSessions[1], startTime: mockSessions[0].startTime },
			mockSessions[2],
		];
		const { container } = render(
			<TimeBetweenStats sessions={sessionsWithOverlap} />,
		);
		const statsCard = container.firstChild as HTMLElement;
		expect(within(statsCard).getByText('5 h')).toBeInTheDocument();
	});
	it('correctly sorts sessions by start time before calculating', () => {
		const unsortedSessions = [
			mockSessions[1],
			mockSessions[2],
			mockSessions[0],
		];
		const { container } = render(
			<TimeBetweenStats sessions={unsortedSessions} />,
		);
		const statsCard = container.firstChild as HTMLElement;
		expect(within(statsCard).getByText('2 h 30 min')).toBeInTheDocument();
	});
	it('handles only two sessions', () => {
		const twoSessions = [mockSessions[0], mockSessions[1]];
		const { container } = render(<TimeBetweenStats sessions={twoSessions} />);
		const statsCard = container.firstChild as HTMLElement;
		expect(within(statsCard).getByText('2 h')).toBeInTheDocument();
	});
});
