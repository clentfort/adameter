import type { DiaperChange } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import PottyStreakCards from './potty-streak-cards';

describe('PottyStreakCards', () => {
	it('calculates and displays potty streaks correctly', () => {
		const streakChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: false,
				pottyUrine: true,
				timestamp: '2026-02-01T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyStool: true,
				timestamp: '2026-02-01T11:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyUrine: true,
				timestamp: '2026-02-01T12:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true, // accident
				timestamp: '2026-02-02T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyUrine: true,
				timestamp: '2026-02-03T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyStool: true,
				timestamp: '2026-02-03T11:00:00.000Z',
			},
		]);
		render(<PottyStreakCards diaperChanges={streakChanges} />);
		expect(screen.getByText('Current Potty Streak')).toBeInTheDocument();
		expect(screen.getByText('Longest Potty Streak')).toBeInTheDocument();
		// Current streak should be 2
		const currentStreakBox = screen
			.getByText('Current Potty Streak')
			.closest('div[data-slot="card-header"]')!.nextElementSibling!;
		expect(currentStreakBox).toHaveTextContent('2');
		// Longest streak should be 3
		const longestStreakBox = screen
			.getByText('Longest Potty Streak')
			.closest('div[data-slot="card-header"]')!.nextElementSibling!;
		expect(longestStreakBox).toHaveTextContent('3');
		// Check for the date of the longest streak
		expect(screen.getByText(/Feb 1, 2026/)).toBeInTheDocument();
	});
});
