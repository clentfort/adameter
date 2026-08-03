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
		costPerDiaper: 0.4,
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

		expect(screen.getByText('Reusable Diaper Metrics')).toBeInTheDocument();
		expect(screen.getByText('Total Cost')).toBeInTheDocument();

		// Total Savings
		expect(
			screen.getAllByText(
				(content) => /0[,.]60/.test(content) && content.includes('€'),
			).length,
		).toBeGreaterThanOrEqual(1);

		// Total Cost
		expect(
			screen.getByText(
				(content) => /1[,.]40/.test(content) && content.includes('€'),
			),
		).toBeInTheDocument();

		// Upfront Cost
		expect(
			screen.getAllByText(
				(content) => /0[,.]60/.test(content) && content.includes('€'),
			).length,
		).toBeGreaterThanOrEqual(1);

		// Usage Cost
		expect(
			screen.getByText(
				(content) => /0[,.]80/.test(content) && content.includes('€'),
			),
		).toBeInTheDocument();

		// Hypothetical Cost
		expect(
			screen.getByText(
				(content) => /2[,.]00/.test(content) && content.includes('€'),
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

		expect(
			screen.queryByText('Reusable Diaper Metrics'),
		).not.toBeInTheDocument();
	});

	it('calculates and shows estimated break-even date when savings are negative but contribution is positive', () => {
		const estChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-disposable-1',
				timestamp: '2026-02-01T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-reusable-1',
				timestamp: '2026-02-02T10:00:00.000Z',
			},
		]);

		const estProducts: DiaperProduct[] = [
			{
				costPerDiaper: 0.3,
				id: 'product-disposable-1',
				isReusable: false,
				name: 'Disposable Hero',
			},
			{
				costPerDiaper: 0.1,
				id: 'product-reusable-1',
				isReusable: true,
				name: 'Reusable Hero',
				upfrontCost: 10.0,
			},
		];

		render(
			<ReusableSavingsCard
				allDiaperChanges={estChanges}
				products={estProducts}
			/>,
		);

		expect(screen.getByText(/Est\./)).toBeInTheDocument();
	});

	it('shows not yet reached when break-even is not possible due to negative contribution', () => {
		const cheapChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-disposable-cheap',
				timestamp: '2026-02-01T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-reusable-expensive',
				timestamp: '2026-02-02T10:00:00.000Z',
			},
		]);

		const cheapProducts: DiaperProduct[] = [
			{
				costPerDiaper: 0.2,
				id: 'product-disposable-cheap',
				isReusable: false,
				name: 'Cheap Disposable',
			},
			{
				costPerDiaper: 0.5,
				id: 'product-reusable-expensive',
				isReusable: true,
				name: 'Expensive Reusable',
				upfrontCost: 10.0,
			},
		];

		render(
			<ReusableSavingsCard
				allDiaperChanges={cheapChanges}
				products={cheapProducts}
			/>,
		);

		expect(screen.getByText('Not yet reached')).toBeInTheDocument();
	});

	it('handles extreme/invalid product fields gracefully', () => {
		const badChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-bad-upfront',
				timestamp: '2026-02-01T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-bad-cost',
				timestamp: '2026-02-02T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: undefined,
				timestamp: '2026-02-03T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'unknown-product',
				timestamp: '2026-02-04T10:00:00.000Z',
			},
		]);

		const badProducts: DiaperProduct[] = [
			{
				costPerDiaper: Infinity,
				id: 'product-bad-upfront',
				isReusable: true,
				name: 'Bad Upfront',
				upfrontCost: Number.NaN,
			},
			{
				costPerDiaper: Number.NaN,
				id: 'product-bad-cost',
				isReusable: true,
				name: 'Bad Cost',
				upfrontCost: 5.0,
			},
		];

		render(
			<ReusableSavingsCard
				allDiaperChanges={badChanges}
				products={badProducts}
			/>,
		);

		expect(screen.getByText('Reusable Diaper Metrics')).toBeInTheDocument();
	});

	it('sets breakEvenDate and breaks when running savings reach zero or more', () => {
		const breakEvenChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-disposable-1',
				timestamp: '2026-02-01T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-reusable-1',
				timestamp: '2026-02-02T10:00:00.000Z',
			},
		]);

		const breakEvenProducts: DiaperProduct[] = [
			{
				costPerDiaper: 1.0,
				id: 'product-disposable-1',
				isReusable: false,
				name: 'Disposable Hero',
			},
			{
				costPerDiaper: 0.2,
				id: 'product-reusable-1',
				isReusable: true,
				name: 'Reusable Hero',
				upfrontCost: 0.5,
			},
		];

		render(
			<ReusableSavingsCard
				allDiaperChanges={breakEvenChanges}
				products={breakEvenProducts}
			/>,
		);

		expect(screen.queryByText('Not yet reached')).not.toBeInTheDocument();
		expect(screen.getByText(/Feb/)).toBeInTheDocument();
	});

	it('triggers edge cases for invalid disposable cost and infinite disposable cost', () => {
		const edgeChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-disposable-nan',
				timestamp: '2026-02-01T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-disposable-inf',
				timestamp: '2026-02-02T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-reusable-1',
				timestamp: '2026-02-03T10:00:00.000Z',
			},
		]);

		const edgeProducts: DiaperProduct[] = [
			{
				costPerDiaper: Number.NaN,
				id: 'product-disposable-nan',
				isReusable: false,
				name: 'NaN Disposable',
			},
			{
				costPerDiaper: Infinity,
				id: 'product-disposable-inf',
				isReusable: false,
				name: 'Inf Disposable',
			},
			{
				costPerDiaper: 0.1,
				id: 'product-reusable-1',
				isReusable: true,
				name: 'Reusable Hero',
				upfrontCost: 1.0,
			},
		];

		render(
			<ReusableSavingsCard
				allDiaperChanges={edgeChanges}
				products={edgeProducts}
			/>,
		);

		expect(screen.getByText('Reusable Diaper Metrics')).toBeInTheDocument();
	});

	it('triggers edge cases for potty stool and empty average disposable around potty events', () => {
		const pottyChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-disposable-1',
				timestamp: '2026-02-01T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyStool: true,
				timestamp: '2026-02-02T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyUrine: true,
				timestamp: '2026-02-20T10:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'product-reusable-1',
				timestamp: '2026-02-03T10:00:00.000Z',
			},
		]);

		const pottyProducts: DiaperProduct[] = [
			{
				costPerDiaper: 0.3,
				id: 'product-disposable-1',
				isReusable: false,
				name: 'Disposable Hero',
			},
			{
				costPerDiaper: 0.1,
				id: 'product-reusable-1',
				isReusable: true,
				name: 'Reusable Hero',
				upfrontCost: 1.0,
			},
		];

		render(
			<ReusableSavingsCard
				allDiaperChanges={pottyChanges}
				products={pottyProducts}
			/>,
		);

		expect(screen.getByText('Reusable Diaper Metrics')).toBeInTheDocument();
	});
});
