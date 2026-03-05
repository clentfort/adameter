import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFeedingSessions } from '@/test-utils/factories/feeding-session';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated'; // Using the real function
import DurationStats from './duration-stats';

const mockSessions = createFeedingSessions([
	{ breast: 'left', durationInSeconds: 600, startTime: '2024-01-01T10:00:00Z' },
	{
		breast: 'right',
		durationInSeconds: 900,
		startTime: '2024-01-01T14:00:00Z',
	},
	{ breast: 'left', durationInSeconds: 300, startTime: '2024-01-02T08:00:00Z' },
]);

describe('DurationStats', () => {
	it('renders null when no sessions are provided', () => {
		const { container } = render(<DurationStats sessions={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('calculates and displays average durations correctly', () => {
		render(<DurationStats sessions={mockSessions} />);

		expect(screen.getByText('10 min')).toBeInTheDocument();

		const avgLeftDuration =
			(mockSessions[0].durationInSeconds + mockSessions[2].durationInSeconds) /
			2;
		expect(
			screen.getByText(formatDurationAbbreviated(avgLeftDuration)),
		).toBeInTheDocument();

		expect(screen.getByText('15 min')).toBeInTheDocument();

		expect(screen.getByText('Average Feeding Duration')).toBeInTheDocument();
		expect(screen.getByText('Left Breast:')).toBeInTheDocument();
		expect(screen.getByText('Right Breast:')).toBeInTheDocument();
	});

	it('handles sessions with only one breast type', () => {
		const leftOnlySessions = createFeedingSessions([
			{ breast: 'left', durationInSeconds: 600 },
			{ breast: 'left', durationInSeconds: 300 },
		]);
		render(<DurationStats sessions={leftOnlySessions} />);

		const avgDurationLeftOnly =
			(leftOnlySessions[0].durationInSeconds +
				leftOnlySessions[1].durationInSeconds) /
			2;
		expect(
			screen.getAllByText(formatDurationAbbreviated(avgDurationLeftOnly))
				.length,
		).toBeGreaterThanOrEqual(2);

		expect(screen.getByText(formatDurationAbbreviated(0))).toBeInTheDocument();
	});

	it('handles sessions with zero duration', () => {
		const zeroDurationSessions = createFeedingSessions([
			{ breast: 'left', durationInSeconds: 0 },
			{ breast: 'right', durationInSeconds: 0 },
		]);
		render(<DurationStats sessions={zeroDurationSessions} />);
		expect(
			screen.getAllByText(formatDurationAbbreviated(0)).length,
		).toBeGreaterThanOrEqual(3);
	});
});
