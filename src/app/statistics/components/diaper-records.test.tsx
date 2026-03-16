import type { DiaperChange } from '@/types/diaper';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectStatsCardPrimaryMetric } from '@/test-utils/assertions/stats-card';
import {
	createDiaperChange,
	createDiaperChanges,
} from '@/test-utils/factories/diaper-change';
import DiaperRecords from './diaper-records';

const mockDiaperChanges = createDiaperChanges([
	{
		containsStool: false,
		containsUrine: true,
		timestamp: '2024-01-01T10:00:00Z',
	},
	{
		containsStool: true,
		containsUrine: true,
		timestamp: '2024-01-01T14:00:00Z',
	},
	{
		containsStool: false,
		containsUrine: true,
		timestamp: '2024-01-02T08:00:00Z',
	},
	{
		containsStool: false,
		containsUrine: true,
		timestamp: '2024-01-03T12:00:00Z',
	},
	{
		containsStool: true,
		containsUrine: false,
		timestamp: '2024-01-03T18:00:00Z',
	},
]);

describe('DiaperRecords', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('renders null when no changes are provided', () => {
		const { container } = render(<DiaperRecords diaperChanges={[]} />);
		expect(container.firstChild).toBeNull();
	});

	it('calculates and displays records correctly', () => {
		vi.setSystemTime(new Date('2024-01-04T12:00:00Z'));
		const { container } = render(
			<DiaperRecords diaperChanges={mockDiaperChanges} />,
		);

		expect(
			screen.getByText('Most diaper changes in a day'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Fewest diaper changes in a day'),
		).toBeInTheDocument();

		expectStatsCardPrimaryMetric(container, 2);
		expectStatsCardPrimaryMetric(container, 1);
	});

	it('excludes diaper changes from today', () => {
		vi.setSystemTime(new Date('2024-01-03T12:00:00Z'));

		const customMock = [
			...mockDiaperChanges,
			createDiaperChange({
				containsStool: false,
				containsUrine: true,
				timestamp: '2024-01-03T20:00:00Z',
			}),
		];

		const { container, rerender } = render(
			<DiaperRecords diaperChanges={customMock} />,
		);
		expect(screen.queryByText('3')).not.toBeInTheDocument();
		expectStatsCardPrimaryMetric(container, 2);

		vi.setSystemTime(new Date('2024-01-05T12:00:00Z'));
		rerender(<DiaperRecords diaperChanges={customMock} />);
		expect(screen.getByText('3')).toBeInTheDocument();
	});

	it('ignores entries with invalid timestamps', () => {
		vi.setSystemTime(new Date('2024-01-04T12:00:00Z'));
		const malformedChanges = [
			...mockDiaperChanges,
			{
				containsStool: false,
				containsUrine: true,
				id: 'invalid-1',
				timestamp: 'not-a-date',
			},
			{
				containsStool: false,
				containsUrine: true,
				id: 'invalid-2',
				timestamp: undefined,
			},
		] as unknown as DiaperChange[];

		render(<DiaperRecords diaperChanges={malformedChanges} />);

		expect(
			screen.getByText('Most diaper changes in a day'),
		).toBeInTheDocument();
		expect(
			screen.getByText('Fewest diaper changes in a day'),
		).toBeInTheDocument();
	});
});
