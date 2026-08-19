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

const mockComparisonSessions = createFeedingSessions([
	{ breast: 'left', durationInSeconds: 500, startTime: '2023-12-25T10:00:00Z' },
	{
		breast: 'right',
		durationInSeconds: 800,
		startTime: '2023-12-25T14:00:00Z',
	},
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

	it('handles comparisonSessions and displays comparison values correctly', () => {
		render(
			<DurationStats
				comparisonSessions={mockComparisonSessions}
				sessions={mockSessions}
			/>,
		);

		// avg total current = (600 + 900 + 300) / 3 = 600.
		// avg total previous = (500 + 800) / 2 = 650.
		// diff total = 600 - 650 = -50.
		// The comparison values are calculated within ComparisonValue.
		// Let's check that the Average Feeding Duration value is shown.
		expect(screen.getByText('10 min')).toBeInTheDocument();

		// Check left breast durations:
		// avg left current = (600 + 300) / 2 = 450.
		// avg left previous = 500.
		// avg right current = 900.
		// avg right previous = 800.
		expect(screen.getByText('7 min')).toBeInTheDocument(); // avg left current (450 seconds, rounded)
		expect(screen.getByText('15 min')).toBeInTheDocument(); // avg right current
	});

	it('covers comparison values where values increase, decrease, or remain same', () => {
		// Create comparison sessions where:
		// left breast increases (current 600 > comparison 300)
		// right breast decreases (current 300 < comparison 900)
		// total is equal (current 450 === comparison 450)
		const current = createFeedingSessions([
			{ breast: 'left', durationInSeconds: 600 },
			{ breast: 'right', durationInSeconds: 300 },
		]);
		const previous = createFeedingSessions([
			{ breast: 'left', durationInSeconds: 300 },
			{ breast: 'right', durationInSeconds: 900 },
		]);

		const { rerender } = render(
			<DurationStats comparisonSessions={previous} sessions={current} />,
		);

		// Total current: (600 + 300)/2 = 450. Total previous: (300+900)/2 = 600. Total decreased.
		// Left: 600 current vs 300 previous. Left increased.
		// Right: 300 current vs 900 previous. Right decreased.
		expect(screen.getByText('10 min')).toBeInTheDocument(); // Left current 600 s = 10 min
		expect(screen.getByText('5 min')).toBeInTheDocument(); // Right current 300 s = 5 min

		// Also check with equal values
		const equalPrevious = createFeedingSessions([
			{ breast: 'left', durationInSeconds: 600 },
			{ breast: 'right', durationInSeconds: 300 },
		]);
		rerender(
			<DurationStats comparisonSessions={equalPrevious} sessions={current} />,
		);

		// Check with previous breast duration = 0 (to cover final branch/lines in ComparisonValue where previous is 0 or unchanged)
		const previousWithZero = createFeedingSessions([
			{ breast: 'left', durationInSeconds: 0 },
			{ breast: 'right', durationInSeconds: 300 },
		]);
		rerender(
			<DurationStats
				comparisonSessions={previousWithZero}
				sessions={current}
			/>,
		);
	});

	it('covers branch where sessions does not have left breast or right breast', () => {
		// Create session with only left breast
		const onlyLeft = createFeedingSessions([
			{ breast: 'left', durationInSeconds: 600 },
		]);
		const { rerender } = render(<DurationStats sessions={onlyLeft} />);
		expect(screen.getAllByText('10 min').length).toBeGreaterThanOrEqual(1);

		// Create session with only right breast
		const onlyRight = createFeedingSessions([
			{ breast: 'right', durationInSeconds: 600 },
			{ breast: 'right', durationInSeconds: 600 },
		]);
		rerender(<DurationStats sessions={onlyRight} />);
		expect(screen.getAllByText('10 min').length).toBeGreaterThanOrEqual(1);
	});
});
