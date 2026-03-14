import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import DiaperStats from './diaper-stats';

vi.mock('@/hooks/use-currency', () => ({
	useCurrency: () => ['EUR', vi.fn()] as const,
}));

const diaperChanges: DiaperChange[] = createDiaperChanges([
	{
		containsStool: false,
		containsUrine: true,
		diaperProductId: 'product-a',
		timestamp: '2026-02-01T10:00:00.000Z',
	},
	{
		containsStool: true,
		containsUrine: true,
		diaperProductId: 'product-b',
		timestamp: '2026-02-02T10:00:00.000Z',
	},
	{
		containsStool: false,
		containsUrine: true,
		timestamp: '2026-02-03T10:00:00.000Z',
	},
]);

const products: DiaperProduct[] = [
	{ costPerDiaper: 0.3, id: 'product-a', isReusable: false, name: 'Brand A' },
	{ costPerDiaper: 0.5, id: 'product-b', isReusable: false, name: 'Brand B' },
];

describe('DiaperStats', () => {
	it('shows diaper costs for the selected time range and per brand', () => {
		render(<DiaperStats diaperChanges={diaperChanges} products={products} />);

		expect(screen.getByText('Cost')).toBeInTheDocument();
		expect(
			screen.getByText(
				(content) => /0[,.]80/.test(content) && content.includes('€'),
			),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole('tab', { name: 'Diaper Brands' }));
		expect(screen.getByText('Brand A')).toBeInTheDocument();
		expect(screen.getByText('Brand B')).toBeInTheDocument();
		expect(
			screen.getByText(
				(content) => /0[,.]30/.test(content) && content.includes('€'),
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				(content) => /0[,.]50/.test(content) && content.includes('€'),
			),
		).toBeInTheDocument();
	});

	it('shows zero cost when no matching product costs are configured', () => {
		render(<DiaperStats diaperChanges={diaperChanges} products={[]} />);

		expect(
			screen.getByText(
				(content) => /0[,.]00/.test(content) && content.includes('€'),
			),
		).toBeInTheDocument();

		fireEvent.click(screen.getByRole('tab', { name: 'Diaper Brands' }));
		expect(screen.getAllByText('Cost not configured').length).toBeGreaterThan(
			0,
		);
	});

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

		render(<DiaperStats diaperChanges={streakChanges} products={[]} />);

		expect(screen.getByText('Potty Streaks')).toBeInTheDocument();
		expect(screen.getByText('Current')).toBeInTheDocument();
		expect(screen.getByText('Longest')).toBeInTheDocument();

		// Current streak should be 2
		const currentStreakBox = screen.getByText('Current').closest('div')!;
		expect(currentStreakBox).toHaveTextContent('2');

		// Longest streak should be 3
		const longestStreakBox = screen.getByText('Longest').closest('div')!;
		expect(longestStreakBox).toHaveTextContent('3');

		// Check for the date of the longest streak
		// 2026-02-01 formatted as PP should be something like Feb 1, 2026
		expect(screen.getByText(/Feb 1, 2026/)).toBeInTheDocument();
	});
});
