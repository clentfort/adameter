import type { DiaperChange } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DiaperRecords from './diaper-records';

const mockDiaperChanges: DiaperChange[] = [
	{
		containsStool: false,
		containsUrine: true,
		id: '1',
		timestamp: '2024-01-01T10:00:00Z', // Day 1
	},
	{
		containsStool: true,
		containsUrine: true,
		id: '2',
		timestamp: '2024-01-01T14:00:00Z', // Day 1. Total Day 1: 2
	},
	{
		containsStool: false,
		containsUrine: true,
		id: '3',
		timestamp: '2024-01-02T08:00:00Z', // Day 2. Total Day 2: 1
	},
	{
		containsStool: false,
		containsUrine: true,
		id: '4',
		timestamp: '2024-01-03T12:00:00Z', // Day 3
	},
	{
		containsStool: true,
		containsUrine: false,
		id: '5',
		timestamp: '2024-01-03T18:00:00Z', // Day 3. Total Day 3: 2
	},
];

describe('DiaperRecords', () => {
	it('renders null when no changes are provided', () => {
		const { container } = render(<DiaperRecords diaperChanges={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('calculates and displays records correctly', () => {
		render(<DiaperRecords diaperChanges={mockDiaperChanges} />);

		expect(
			screen.getByText('Most diaper changes in a day'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Fewest diaper changes in a day'),
		).toBeInTheDocument();

		expect(screen.getByText('2')).toBeInTheDocument();
		expect(screen.getByText('1')).toBeInTheDocument();
	});
});
