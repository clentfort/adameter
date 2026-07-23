import type { DiaperChange } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import PottySavingsStats from './potty-savings-stats';

vi.mock('@/hooks/use-currency', () => ({
	useCurrency: () => ['USD', vi.fn()] as const,
}));

vi.mock('@/contexts/i18n-context', () => ({
	useLanguage: () => ({ locale: 'en-US' }),
}));

describe('PottySavingsStats', () => {
	const mockDisposableChanges = [
		{ cost: 0.3, timestamp: new Date('2026-03-10T12:00:00.000Z') },
		{ cost: 0.4, timestamp: new Date('2026-03-12T12:00:00.000Z') },
		{ cost: 0.5, timestamp: new Date('2026-03-25T12:00:00.000Z') }, // far away
	];

	it('renders with zero savings when no changes are provided', () => {
		render(
			<PottySavingsStats diaperChanges={[]} disposableChanges={mockDisposableChanges} />,
		);

		expect(screen.getByText('Potty Savings')).toBeInTheDocument();
		expect(screen.getByText('$0.00')).toBeInTheDocument();
		expect(screen.getByText('Estimated savings from successful potty hits.')).toBeInTheDocument();
	});

	it('calculates and renders savings when successful potty hits occur', () => {
		// A successful potty hit is defined as:
		// (change.pottyUrine && !change.containsUrine) || (change.pottyStool && !change.containsStool)
		const changes: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: false,
				pottyUrine: true,
				timestamp: '2026-03-11T12:00:00.000Z', // 7-day average of (0.3, 0.4) = 0.35
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyStool: true,
				timestamp: '2026-03-13T12:00:00.000Z', // 7-day average of (0.3, 0.4) = 0.35
			},
			{
				containsStool: true,
				containsUrine: true,
				pottyUrine: true,
				timestamp: '2026-03-12T12:00:00.000Z', // Not a successful potty hit (contains stool and urine)
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyUrine: true,
				timestamp: '2026-03-01T12:00:00.000Z', // No disposable changes within 7 days, average is null (falls back to 0)
			},
		]);

		render(
			<PottySavingsStats
				diaperChanges={changes}
				disposableChanges={mockDisposableChanges}
			/>,
		);

		// Savings should be 0.35 + 0.35 = 0.70
		expect(screen.getByText('$0.70')).toBeInTheDocument();
	});

	it('renders comparison value when comparisonDiaperChanges is provided', () => {
		const currentChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: false,
				pottyUrine: true,
				timestamp: '2026-03-11T12:00:00.000Z', // average = 0.35
			},
		]);

		const comparisonChanges: DiaperChange[] = createDiaperChanges([
			{
				containsStool: false,
				containsUrine: false,
				pottyUrine: true,
				timestamp: '2026-03-11T12:00:00.000Z',
			},
			{
				containsStool: false,
				containsUrine: false,
				pottyStool: true,
				timestamp: '2026-03-11T12:00:00.000Z',
			}, // comparison savings = 0.70
		]);

		const { container } = render(
			<PottySavingsStats
				comparisonDiaperChanges={comparisonChanges}
				diaperChanges={currentChanges}
				disposableChanges={mockDisposableChanges}
			/>,
		);

		expect(screen.getByText('$0.35')).toBeInTheDocument();
		// Let's directly check the HTML text content or check the span element.
		expect(container.textContent).toContain('50');
		expect(container.textContent).toContain('%');
	});
});
