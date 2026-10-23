import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DiaperCostChart from './diaper-cost-chart';

vi.mock('@/components/charts/bar-chart', () => ({
	default: ({
		datasets,
	}: {
		datasets: Array<{ [key: string]: unknown; label: string }>;
	}) => (
		<div data-testid="bar-chart">
			{datasets.map((dataset, idx) => (
				<span data-testid="dataset-label" key={idx}>
					{dataset.label}
				</span>
			))}
		</div>
	),
}));

vi.mock('@/hooks/use-currency', () => ({
	useCurrency: () => ['EUR', vi.fn()],
}));

vi.mock('@/hooks/use-show-comparison-charts', () => ({
	useShowComparisonCharts: () => [false, vi.fn()],
}));

describe('DiaperCostChart', () => {
	it('preserves dataset order based on first appearance in diaperChanges', () => {
		const productA: DiaperProduct = {
			costPerDiaper: 0.5,
			id: 'prod-a',
			isReusable: false,
			name: 'Product A',
		};

		const productB: DiaperProduct = {
			costPerDiaper: 0.8,
			id: 'prod-b',
			isReusable: false,
			name: 'Product B',
		};

		const diaperChanges: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'prod-b',
				id: 'change-1',
				timestamp: new Date('2025-01-02T10:00:00Z').toISOString(),
			},
			{
				containsStool: false,
				containsUrine: true,
				diaperProductId: 'prod-a',
				id: 'change-2',
				timestamp: new Date('2025-01-01T10:00:00Z').toISOString(),
			},
		];

		const primaryRange = {
			from: new Date('2025-01-01T00:00:00Z'),
			to: new Date('2025-01-02T23:59:59Z'),
		};

		render(
			<DiaperCostChart
				diaperChanges={diaperChanges}
				primaryRange={primaryRange}
				products={[productA, productB]}
			/>,
		);

		const labels = screen
			.getAllByTestId('dataset-label')
			.map((el) => el.textContent);

		expect(labels).toEqual(['Product B', 'Product A']);
	});
});
