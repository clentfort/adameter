import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFeedingSessions } from '@/test-utils/factories/feeding-session';
import TotalDurationStats from './total-duration-stats';

const mockSessions = createFeedingSessions([
	{ breast: 'left', durationInSeconds: 600 },
	{ breast: 'right', durationInSeconds: 900 },
	{ breast: 'left', durationInSeconds: 300 },
]);

describe('TotalDurationStats', () => {
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
		const singleSession = [mockSessions[0]];
		render(<TotalDurationStats sessions={singleSession} />);
		expect(screen.getByText('10 min')).toBeInTheDocument();
	});

	it('handles sessions with zero duration', () => {
		const zeroDurationSessions = [
			{ ...mockSessions[0], durationInSeconds: 0 },
			{ ...mockSessions[1], durationInSeconds: 0 },
		];
		render(<TotalDurationStats sessions={zeroDurationSessions} />);
		expect(screen.getByText('0 min')).toBeInTheDocument();
	});
});
