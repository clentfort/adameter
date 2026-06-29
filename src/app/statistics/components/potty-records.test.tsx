import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import PottyRecords from './potty-records';

describe('PottyRecords', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-10T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns null when there are no potty successes', () => {
		const diaperChanges = createDiaperChanges([
			{ containsUrine: true, timestamp: '2024-01-01T10:00:00Z' },
		]);
		const { container } = render(<PottyRecords diaperChanges={diaperChanges} />);
		expect(container.firstChild).toBeNull();
	});

	it('calculates and displays the day with most potty hits (excluding today)', () => {
		const diaperChanges = createDiaperChanges([
			// 2 hits on Jan 1
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-01T10:00:00Z' },
			{ containsUrine: false, pottyStool: true, timestamp: '2024-01-01T14:00:00Z' },
			// 1 hit on Jan 2
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-02T10:00:00Z' },
			// 3 hits on today (Jan 10) - should be excluded
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-10T10:00:00Z' },
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-10T11:00:00Z' },
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-10T12:00:00Z' },
		]);

		render(<PottyRecords diaperChanges={diaperChanges} />);

		expect(screen.getByText('Most potty hits in a day')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
		expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
	});

	it('calculates and displays the longest potty streak', () => {
		const diaperChanges = createDiaperChanges([
			// Streak of 2
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-01T10:00:00Z' },
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-01T14:00:00Z' },
			// Accident breaks streak
			{ containsUrine: true, timestamp: '2024-01-02T10:00:00Z' },
			// Streak of 3
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-03T10:00:00Z' },
			{ containsUrine: false, pottyStool: true, timestamp: '2024-01-04T10:00:00Z' },
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-05T10:00:00Z' },
			// Mixed success/accident - success but contains urine
			{ containsUrine: true, pottyUrine: true, timestamp: '2024-01-06T10:00:00Z' },
		]);

		render(<PottyRecords diaperChanges={diaperChanges} />);

		expect(screen.getByText('Longest potty streak')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();
		// Jan 3 to Jan 5
		expect(screen.getByText('Jan 3, 2024 - Jan 5, 2024')).toBeInTheDocument();
	});

	it('renders correctly for a single-day streak', () => {
		const diaperChanges = createDiaperChanges([
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-01T10:00:00Z' },
		]);

		render(<PottyRecords diaperChanges={diaperChanges} />);

		expect(screen.getAllByText('1')).toHaveLength(2);
		expect(screen.getAllByText('Jan 1, 2024')).toHaveLength(2);
	});

	it('sorts diaper changes for streak calculation', () => {
		const diaperChanges = createDiaperChanges([
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-03T10:00:00Z' },
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-01T10:00:00Z' },
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-02T10:00:00Z' },
		]);

		render(<PottyRecords diaperChanges={diaperChanges} />);

		expect(screen.getByText('3')).toBeInTheDocument();
		expect(screen.getByText('Jan 1, 2024 - Jan 3, 2024')).toBeInTheDocument();
	});

	it('handles case with no potty changes on other days than today', () => {
		const diaperChanges = createDiaperChanges([
			{ containsUrine: false, pottyUrine: true, timestamp: '2024-01-10T10:00:00Z' },
		]);

		render(<PottyRecords diaperChanges={diaperChanges} />);

		expect(screen.queryByText('Most potty hits in a day')).toBeNull();
		expect(screen.getByText('Longest potty streak')).toBeInTheDocument();
	});
});
