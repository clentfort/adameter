import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import PottySuccessStats from './potty-success-stats';

describe('PottySuccessStats', () => {
	it('renders zero metrics when no diaper changes are provided', () => {
		render(<PottySuccessStats diaperChanges={[]} />);
		// total, urineCount, and stoolCount are all 0
		expect(screen.getAllByText('0')).toHaveLength(3);
		expect(screen.getByText('0.0')).toBeInTheDocument(); // avg per day
	});

	it('calculates metrics correctly for a single day', () => {
		const diaperChanges = createDiaperChanges([
			{
				pottyStool: false,
				pottyUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			},
			{
				pottyStool: true,
				pottyUrine: false,
				timestamp: '2024-01-01T14:00:00Z',
			},
		]);

		render(<PottySuccessStats diaperChanges={diaperChanges} />);

		// 2 potty hits in 1 day = 2.0 avg
		// total is 2, urine is 1, stool is 1
		expect(screen.getByText('2')).toBeInTheDocument(); // total
		expect(screen.getByText('2.0')).toBeInTheDocument(); // avg
		expect(screen.getAllByText('1')).toHaveLength(2); // urine, stool
	});

	it('calculates metrics correctly across multiple days', () => {
		const diaperChanges = createDiaperChanges([
			{
				pottyStool: false,
				pottyUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			},
			{
				pottyStool: true,
				pottyUrine: true,
				timestamp: '2024-01-02T10:00:00Z',
			},
			{
				pottyStool: false,
				pottyUrine: false,
				timestamp: '2024-01-03T10:00:00Z',
			},
		]);

		render(<PottySuccessStats diaperChanges={diaperChanges} />);

		// 2 potty hits (Jan 1 and Jan 2) across 3 days (Jan 1, 2, 3) = 0.7 avg
		// Total hits = 2
		// Urine hits = 2 (Jan 1, Jan 2)
		// Stool hits = 1 (Jan 2)
		expect(screen.getAllByText('2')).toHaveLength(2); // total and urineCount
		expect(screen.getByText('0.7')).toBeInTheDocument(); // avg
		expect(screen.getByText('1')).toBeInTheDocument(); // stoolCount
	});

	it('displays comparison values when comparisonDiaperChanges are provided', () => {
		const currentChanges = createDiaperChanges([
			{ pottyUrine: true, timestamp: '2024-01-01T10:00:00Z' },
			{ pottyUrine: true, timestamp: '2024-01-01T14:00:00Z' },
		]);
		const comparisonChanges = createDiaperChanges([
			{ pottyUrine: true, timestamp: '2024-01-01T10:00:00Z' },
		]);

		render(
			<PottySuccessStats
				comparisonDiaperChanges={comparisonChanges}
				diaperChanges={currentChanges}
			/>,
		);

		// Current total = 2, Previous total = 1. Increase is 100%.
		// Current urine = 2, Previous urine = 1. Increase is 100%.
		// Current avg = 2.0, Previous avg = 1.0. Increase is 100%.
		expect(screen.getAllByText('↑100%')).toHaveLength(3);
	});
});
