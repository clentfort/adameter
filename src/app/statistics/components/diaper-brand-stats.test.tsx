import type { DiaperProduct } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import DiaperBrandStats from './diaper-brand-stats';

// Mock PieChart to avoid canvas issues and focus on DiaperBrandStats logic
vi.mock('@/components/charts/pie-chart', () => ({
	default: vi.fn(({ datasets, labels }) => (
		<div data-testid="pie-chart">
			<div data-testid="datasets">{JSON.stringify(datasets)}</div>
			<div data-testid="labels">{JSON.stringify(labels)}</div>
		</div>
	)),
}));

describe('DiaperBrandStats', () => {
	const products: DiaperProduct[] = [
		{
			color: '#ff0000',
			id: 'p1',
			isReusable: false,
			name: 'Brand A',
			profileId: 'default',
		},
		{
			color: '#00ff00',
			id: 'p2',
			isReusable: false,
			name: 'Brand B',
			profileId: 'default',
		},
	];

	it('returns null when no diaper changes are provided', () => {
		const { container } = render(
			<DiaperBrandStats diaperChanges={[]} products={products} />,
		);
		expect(container.firstChild).toBeNull();
	});

	it('calculates brand data and renders PieChart with correct data', () => {
		const diaperChanges = createDiaperChanges([
			{ diaperProductId: 'p1', timestamp: '2024-01-01T10:00:00Z' },
			{ diaperProductId: 'p1', timestamp: '2024-01-01T11:00:00Z' },
			{ diaperProductId: 'p2', timestamp: '2024-01-01T12:00:00Z' },
			{ diaperProductId: 'unknown', timestamp: '2024-01-01T13:00:00Z' }, // Should be ignored
			{ timestamp: '2024-01-01T14:00:00Z' }, // Missing productId, should be ignored
		]);

		render(
			<DiaperBrandStats diaperChanges={diaperChanges} products={products} />,
		);

		expect(screen.getByTestId('pie-chart')).toBeInTheDocument();

		const datasets = JSON.parse(screen.getByTestId('datasets').textContent!);
		const labels = JSON.parse(screen.getByTestId('labels').textContent!);

		// Total valid changes = 2 (p1) + 1 (p2) = 3
		// Brand A: 2 (67%), Brand B: 1 (33%)

		expect(labels).toContain('Brand A: 2 (67%)');
		expect(labels).toContain('Brand B: 1 (33%)');

		expect(datasets[0].data).toEqual([2, 1]);
		expect(datasets[0].backgroundColor).toEqual(['#ff0000', '#00ff00']);
	});

	it('uses default color if product color is missing', () => {
		const productsWithNoColor: DiaperProduct[] = [
			{ id: 'p1', isReusable: false, name: 'Brand A', profileId: 'default' },
		];
		const diaperChanges = createDiaperChanges([
			{ diaperProductId: 'p1', timestamp: '2024-01-01T10:00:00Z' },
		]);

		render(
			<DiaperBrandStats
				diaperChanges={diaperChanges}
				products={productsWithNoColor}
			/>,
		);

		const datasets = JSON.parse(screen.getByTestId('datasets').textContent!);
		expect(datasets[0].backgroundColor).toEqual(['#94a3b8']);
	});
});
