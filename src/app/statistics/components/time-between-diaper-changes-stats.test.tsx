import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import TimeBetweenDiaperChangesStats from './time-between-diaper-changes-stats';

describe('TimeBetweenDiaperChangesStats', () => {
	it('should render 0 min when diaperChanges is empty', () => {
		render(<TimeBetweenDiaperChangesStats diaperChanges={[]} />);
		expect(screen.getByText('0 min')).toBeInTheDocument();
	});

	it('should render 0 min when there is only one diaper change', () => {
		const changes = createDiaperChanges([
			{ timestamp: '2024-01-01T10:00:00Z' },
		]);
		render(<TimeBetweenDiaperChangesStats diaperChanges={changes} />);
		expect(screen.getByText('0 min')).toBeInTheDocument();
	});

	it('should calculate and render average time between multiple diaper changes', () => {
		const changes = createDiaperChanges([
			{ timestamp: '2024-01-01T10:00:00Z' },
			{ timestamp: '2024-01-01T12:00:00Z' }, // 2 hours after
			{ timestamp: '2024-01-01T14:00:00Z' }, // 2 hours after
		]);
		render(<TimeBetweenDiaperChangesStats diaperChanges={changes} />);

		// Total time = 4 hours. Number of intervals = 2. Avg = 2 hours.
		expect(screen.getByText('2 h')).toBeInTheDocument();
	});

	it('should handle unsorted diaper changes correctly', () => {
		const changes = createDiaperChanges([
			{ timestamp: '2024-01-01T14:00:00Z' },
			{ timestamp: '2024-01-01T10:00:00Z' },
			{ timestamp: '2024-01-01T12:00:00Z' },
		]);
		render(<TimeBetweenDiaperChangesStats diaperChanges={changes} />);

		expect(screen.getByText('2 h')).toBeInTheDocument();
	});

	it('should render comparison value when comparisonDiaperChanges is provided', () => {
		const currentChanges = createDiaperChanges([
			{ timestamp: '2024-01-01T10:00:00Z' },
			{ timestamp: '2024-01-01T12:00:00Z' }, // Avg = 2h
		]);
		const comparisonChanges = createDiaperChanges([
			{ timestamp: '2024-01-01T10:00:00Z' },
			{ timestamp: '2024-01-01T14:00:00Z' }, // Avg = 4h
		]);

		render(
			<TimeBetweenDiaperChangesStats
				comparisonDiaperChanges={comparisonChanges}
				diaperChanges={currentChanges}
			/>,
		);

		expect(screen.getByText('2 h')).toBeInTheDocument();
		// Current 2h, Previous 4h. Decrease of 50%.
		// Since it's inverse=true in the component:
		// Decrease in time between diaper changes (more frequent) is considered "bad" (rose color, but text is ↑/↓ 50%)
		// Wait, ComparisonValue calculates (current - previous) / previous.
		// (2 - 4) / 4 = -0.5 -> 50% decrease.
		expect(screen.getByText('↓50%')).toBeInTheDocument();
	});
});
