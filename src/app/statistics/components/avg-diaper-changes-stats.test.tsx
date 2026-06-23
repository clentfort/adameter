import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createDiaperChanges } from '@/test-utils/factories/diaper-change';
import AvgDiaperChangesStats from './avg-diaper-changes-stats';

describe('AvgDiaperChangesStats', () => {
	it('renders zero averages when no diaper changes are provided', () => {
		render(<AvgDiaperChangesStats diaperChanges={[]} />);
		expect(screen.getAllByText('0.0')).toHaveLength(3);
	});

	it('calculates averages correctly for a single day', () => {
		const diaperChanges = createDiaperChanges([
			{
				timestamp: '2024-01-01T10:00:00Z',
				containsUrine: true,
				containsStool: false,
			},
			{
				timestamp: '2024-01-01T14:00:00Z',
				containsUrine: false,
				containsStool: true,
			},
		]);

		render(<AvgDiaperChangesStats diaperChanges={diaperChanges} />);

		// 2 changes in 1 day = 2.0 avg
		// 1 urine in 1 day = 1.0 urine avg
		// 1 stool in 1 day = 1.0 stool avg
		expect(screen.getAllByText('2.0')).toHaveLength(1);
		expect(screen.getAllByText('1.0')).toHaveLength(2);
	});

	it('calculates averages correctly across multiple days', () => {
		const diaperChanges = createDiaperChanges([
			{
				timestamp: '2024-01-01T10:00:00Z',
				containsUrine: true,
				containsStool: false,
			},
			{
				timestamp: '2024-01-02T10:00:00Z',
				containsUrine: true,
				containsStool: true,
			},
			{
				timestamp: '2024-01-03T10:00:00Z',
				containsUrine: false,
				containsStool: false,
			},
		]);

		render(<AvgDiaperChangesStats diaperChanges={diaperChanges} />);

		// 3 changes across 3 days (Jan 1, 2, 3) = 1.0 avg
		// 2 urine across 3 days = 0.7 urine avg
		// 1 stool across 3 days = 0.3 stool avg
		expect(screen.getByText('1.0')).toBeInTheDocument();
		expect(screen.getByText('0.7')).toBeInTheDocument();
		expect(screen.getByText('0.3')).toBeInTheDocument();
	});

	it('displays comparison values when comparisonDiaperChanges are provided', () => {
		const currentChanges = createDiaperChanges([
			{ timestamp: '2024-01-01T10:00:00Z', containsUrine: true },
			{ timestamp: '2024-01-01T14:00:00Z', containsUrine: true },
		]);
		const comparisonChanges = createDiaperChanges([
			{ timestamp: '2024-01-01T10:00:00Z', containsUrine: true },
		]);

		render(
			<AvgDiaperChangesStats
				diaperChanges={currentChanges}
				comparisonDiaperChanges={comparisonChanges}
			/>,
		);

		// Current avg = 2.0, Previous avg = 1.0. Increase is 100%.
		// Current urine avg = 2.0, Previous urine avg = 1.0. Increase is 100%.
		expect(screen.getAllByText('↑100%')).toHaveLength(2);
	});
});
