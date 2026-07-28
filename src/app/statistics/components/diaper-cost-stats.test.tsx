import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import DiaperCostStats from './diaper-cost-stats';

vi.mock('@/contexts/i18n-context', () => ({
	useLanguage: () => ({ locale: 'en-US' }),
}));

vi.mock('@/hooks/use-currency', () => ({
	useCurrency: () => ['USD', vi.fn()] as const,
}));

describe('DiaperCostStats', () => {
	const mockProducts: DiaperProduct[] = [
		{
			archived: false,
			color: '#000',
			costPerDiaper: 0.25,
			id: 'prod-1',
			isReusable: false,
			name: 'Product 1',
			upfrontCost: 0,
		},
		{
			archived: false,
			color: '#fff',
			costPerDiaper: 0.5,
			id: 'prod-2',
			isReusable: false,
			name: 'Product 2',
			upfrontCost: 0,
		},
	];

	it('renders with zero values when diaperChanges is empty', () => {
		render(<DiaperCostStats diaperChanges={[]} products={mockProducts} />);

		expect(screen.getByText('Diaper Costs')).toBeInTheDocument();
		expect(screen.getAllByText('$0.00')).toHaveLength(2);
	});

	it('calculates total cost and average per day correctly', () => {
		const diaperChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'prod-1',
				id: 'change-1',
				timestamp: '2026-03-01T12:00:00.000Z',
			},
			{
				containsStool: true,
				containsUrine: false,
				diaperProductId: 'prod-2',
				id: 'change-2',
				timestamp: '2026-03-03T12:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'non-existent',
				id: 'change-3',
				timestamp: '2026-03-02T12:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				id: 'change-4',
				timestamp: '2026-03-02T12:00:00.000Z',
			},
		]);

		render(
			<DiaperCostStats diaperChanges={diaperChanges} products={mockProducts} />,
		);

		expect(screen.getByText('$0.75')).toBeInTheDocument();
		expect(screen.getByText('$0.25')).toBeInTheDocument();
	});

	it('renders comparison values when comparisonDiaperChanges is provided', () => {
		const currentChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'prod-1',
				id: 'change-1',
				timestamp: '2026-03-01T12:00:00.000Z',
			},
		]);

		const comparisonChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'prod-2',
				id: 'change-2',
				timestamp: '2026-03-01T12:00:00.000Z',
			},
		]);

		const { container } = render(
			<DiaperCostStats
				comparisonDiaperChanges={comparisonChanges}
				diaperChanges={currentChanges}
				products={mockProducts}
			/>,
		);

		expect(screen.getAllByText('$0.25')).toHaveLength(2);
		expect(container.textContent).toContain('50');
		expect(container.textContent).toContain('%');
	});

	it('uses default properties when diaperChanges and products are not provided', () => {
		// @ts-expect-error - testing default parameter values
		render(<DiaperCostStats />);
		expect(screen.getByText('Diaper Costs')).toBeInTheDocument();
		expect(screen.getAllByText('$0.00')).toHaveLength(2);
	});

	it('handles empty comparisonDiaperChanges correctly', () => {
		const currentChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'prod-1',
				id: 'change-1',
				timestamp: '2026-03-01T12:00:00.000Z',
			},
		]);

		render(
			<DiaperCostStats
				comparisonDiaperChanges={[]}
				diaperChanges={currentChanges}
				products={mockProducts}
			/>,
		);

		expect(screen.getAllByText('$0.25')).toHaveLength(2);
	});
});
