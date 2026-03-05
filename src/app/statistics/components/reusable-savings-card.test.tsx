import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import ReusableSavingsCard from './reusable-savings-card';

vi.mock('@/hooks/use-currency', () => ({
	useCurrency: () => ['EUR', vi.fn()] as const,
}));

const allChanges: DiaperChange[] = createDiaperChanges([
	{
		containsStool: false,
		containsUrine: true,
		diaperProductId: 'product-a',
		timestamp: '2026-02-01T10:00:00.000Z',
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperProductId: 'product-r',
		timestamp: '2026-02-02T10:00:00.000Z',
	},
	{
		containsStool: true,
		containsUrine: true,
		diaperProductId: 'product-b',
		timestamp: '2026-02-03T10:00:00.000Z',
	},
	{
		containsStool: false,
		containsUrine: true,
		diaperProductId: 'product-r',
		timestamp: '2026-02-04T10:00:00.000Z',
	},
	{
		containsStool: false,
		containsUrine: false,
		pottyUrine: true,
		timestamp: '2026-02-05T10:00:00.000Z',
	},
]);

const products: DiaperProduct[] = [
	{ costPerDiaper: 0.3, id: 'product-a', isReusable: false, name: 'Brand A' },
	{ costPerDiaper: 0.5, id: 'product-b', isReusable: false, name: 'Brand B' },
	{
		id: 'product-r',
		isReusable: true,
		name: 'Reusable Hero',
		upfrontCost: 0.6,
	},
];

describe('ReusableSavingsCard', () => {
	it('shows total, potty and reusable savings with total cost', () => {
		render(
			<ReusableSavingsCard allDiaperChanges={allChanges} products={products} />,
		);

		expect(screen.getByText('Diaper Savings')).toBeInTheDocument();
		expect(screen.getByText('POTTY')).toBeInTheDocument();
		expect(screen.getByText('REUSABLE')).toBeInTheDocument();
		expect(screen.getByText('Total Cost')).toBeInTheDocument();

		expect(
			screen.getByText(
				(content) => /0[,.]60/.test(content) && content.includes('€'),
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				(content) => /1[,.]40/.test(content) && content.includes('€'),
			),
		).toBeInTheDocument();
		expect(screen.queryByText('Not yet reached')).not.toBeInTheDocument();
	});

	it('does not render when no reusable product is configured', () => {
		render(
			<ReusableSavingsCard
				allDiaperChanges={allChanges}
				products={products.filter((product) => !product.isReusable)}
			/>,
		);

		expect(screen.queryByText('Diaper Savings')).not.toBeInTheDocument();
	});
});
