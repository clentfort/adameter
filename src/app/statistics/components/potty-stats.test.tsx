import type { DiaperChange } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import PottyStats from './potty-stats';

vi.mock('@/hooks/use-currency', () => ({
	useCurrency: () => ['EUR', vi.fn()] as const,
}));

const pottyChanges: DiaperChange[] = createDiaperChanges([
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
		timestamp: '2026-02-02T10:00:00.000Z',
	},
	{
		containsStool: false,
		containsUrine: false,
		pottyStool: true,
		pottyUrine: true,
		timestamp: '2026-02-03T10:00:00.000Z',
	},
]);

describe('PottyStats', () => {
	it('calculates and displays potty successes correctly', () => {
		render(<PottyStats diaperChanges={pottyChanges} />);

		expect(screen.getByText('Potty Statistics')).toBeInTheDocument();
		expect(screen.getByText('Total')).toBeInTheDocument();
		expect(screen.getByText('Urine')).toBeInTheDocument();
		expect(screen.getByText('Stool')).toBeInTheDocument();

		const totalBox = screen.getByText('Total').closest('div')!;
		expect(totalBox).toHaveTextContent('3');

		const urineBox = screen.getByText('Urine').closest('div')!;
		expect(urineBox).toHaveTextContent('2');

		const stoolBox = screen.getByText('Stool').closest('div')!;
		expect(stoolBox).toHaveTextContent('2');
	});
});
