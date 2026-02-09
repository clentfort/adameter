import type { DiaperChange } from '@/types/diaper';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('renders null when no changes are provided', () => {
		const { container } = render(<DiaperRecords diaperChanges={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('calculates and displays records correctly', () => {
		vi.setSystemTime(new Date('2024-01-04T12:00:00Z'));
		render(<DiaperRecords diaperChanges={mockDiaperChanges} />);

		expect(screen.getByText('Most diaper changes in a day')).toBeInTheDocument();
		expect(
			screen.getByText('Fewest diaper changes in a day'),
		).toBeInTheDocument();

		// Most: 2, Fewest: 1
		expect(screen.getByText('2', { selector: '.text-2xl' })).toBeInTheDocument();
		expect(screen.getByText('1', { selector: '.text-2xl' })).toBeInTheDocument();
	});

	it('excludes diaper changes from today', () => {
		vi.setSystemTime(new Date('2024-01-03T12:00:00Z'));

		const customMock: DiaperChange[] = [
			...mockDiaperChanges,
			{
				containsStool: false,
				containsUrine: true,
				id: '6',
				timestamp: '2024-01-03T20:00:00Z',
			},
		]; // Jan 3rd now has 3 changes.

		render(<DiaperRecords diaperChanges={customMock} />);
		expect(screen.queryByText('3')).not.toBeInTheDocument();
		expect(screen.getByText('2', { selector: '.text-2xl' })).toBeInTheDocument();

		cleanup();
		vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
		render(<DiaperRecords diaperChanges={customMock} />);
		expect(screen.getByText('3')).toBeInTheDocument();
	});
});
