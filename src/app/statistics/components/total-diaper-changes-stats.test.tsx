import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDiaperChange } from '@/test-utils/factories/diaper-change';
import TotalDiaperChangesStats from './total-diaper-changes-stats';

describe('TotalDiaperChangesStats', () => {
	it('renders with empty data', () => {
		render(<TotalDiaperChangesStats diaperChanges={[]} />);

		expect(screen.getByText('Total Changes')).toBeInTheDocument();
		// Total: 0, Urine: 0, Poo: 0
		expect(screen.getAllByText('0')).toHaveLength(3);
	});

	it('renders counts correctly for various diaper changes', () => {
		const diaperChanges = [
			createDiaperChange({ containsStool: true, containsUrine: false }),
			createDiaperChange({ containsStool: false, containsUrine: true }),
			createDiaperChange({ containsStool: true, containsUrine: true }),
		];

		render(<TotalDiaperChangesStats diaperChanges={diaperChanges} />);

		expect(screen.getByText('3')).toBeInTheDocument();
		// contains urine: 2 (indices 1, 2)
		// contains poo: 2 (indices 0, 2)
		expect(screen.getAllByText('2')).toHaveLength(2);
	});

	it('renders comparison values when comparisonDiaperChanges is provided', () => {
		const diaperChanges = [
			createDiaperChange({ containsStool: false, containsUrine: true }),
		];
		const comparisonDiaperChanges = [
			createDiaperChange({ containsStool: true, containsUrine: true }),
			createDiaperChange({ containsStool: true, containsUrine: true }),
		];

		render(
			<TotalDiaperChangesStats
				comparisonDiaperChanges={comparisonDiaperChanges}
				diaperChanges={diaperChanges}
			/>,
		);

		// Total: 1, Urine: 1, Poo: 0
		expect(screen.getAllByText('1')).toHaveLength(2);
		expect(screen.getByText('0')).toBeInTheDocument();

		// Total: 1 current vs 2 previous -> -50%
		// Urine: 1 current vs 2 previous -> -50%
		// Poo: 0 current vs 2 previous -> -100%

		expect(screen.getAllByText('↓50%')).toHaveLength(2);
		expect(screen.getByText('↓100%')).toBeInTheDocument();
	});
});
