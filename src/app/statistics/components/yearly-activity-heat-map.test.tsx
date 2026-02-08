import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import YearlyActivityHeatMap from './yearly-activity-heat-map';

describe('YearlyActivityHeatMap', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('renders title and description', () => {
		render(
			<YearlyActivityHeatMap
				dates={[]}
				description="Description"
				title="Title"
			/>,
		);

		expect(screen.getByText('Title')).toBeInTheDocument();
		expect(screen.getByText('Description')).toBeInTheDocument();
	});

	it('counts entries per day and applies higher intensity for busier days', () => {
		render(
			<YearlyActivityHeatMap
				dates={[
					'2024-01-02T09:00:00Z',
					'2024-01-02T10:00:00Z',
					'2024-01-03T09:00:00Z',
					'2023-12-31T09:00:00Z',
				]}
				description="Description"
				title="Title"
			/>,
		);

		const busyDayCell = screen.getByTestId('yearly-cell-2024-01-02');
		const lightDayCell = screen.getByTestId('yearly-cell-2024-01-03');
		const prevYearDayCell = screen.getByTestId('yearly-cell-2023-12-31');

		expect(busyDayCell).toHaveAttribute('title', 'January 2nd, 2024: 2');
		expect(lightDayCell).toHaveAttribute('title', 'January 3rd, 2024: 1');
		expect(prevYearDayCell).toHaveAttribute('title', 'December 31st, 2023: 1');

		expect(busyDayCell).toHaveClass('bg-left-breast');
		expect(lightDayCell).toHaveClass('bg-left-breast/30');
		expect(prevYearDayCell).toHaveClass('bg-left-breast/30');
	});

	it('includes data from exactly 365 days ago but not 366', () => {
		// Today is 2024-06-15
		// 364 days ago is 2023-06-17
		// 365 days ago is 2023-06-16 (wait, leap years? 2024 is a leap year)
		// 2024-06-15 - 364 days.
		// Jan: 31, Feb: 29 (2024), Mar: 31, Apr: 30, May: 31, Jun: 15.
		// Sum: 15+31+30+31+29+31 = 167 days in 2024.
		// 365 - 167 = 198 days in 2023.
		// Dec: 31, Nov: 30, Oct: 31, Sep: 30, Aug: 31, Jul: 31, Jun: 14?
		// Let's just use subDays(now, 364) which I used in code.

		render(
			<YearlyActivityHeatMap
				dates={[
					'2023-06-17T10:00:00Z', // Exactly 364 days ago (start of range)
					'2023-06-16T10:00:00Z', // 365 days ago (outside range)
				]}
				description="Description"
				title="Title"
			/>,
		);

		const inRangeCell = screen.getByTestId('yearly-cell-2023-06-17');
		const outOfRangeCell = screen.getByTestId('yearly-cell-2023-06-16');

		expect(inRangeCell).toHaveAttribute('title', 'June 17th, 2023: 1');
		expect(outOfRangeCell).toHaveAttribute('title', 'June 16th, 2023: 0');

		// With only one entry, count 1 is the maximum, so it gets level 4 (highest intensity)
		expect(inRangeCell).toHaveClass('bg-left-breast');
		expect(outOfRangeCell).toHaveClass('bg-muted');
	});

	it('uses amber palette for diaper heat map', () => {
		render(
			<YearlyActivityHeatMap
				dates={['2024-01-02T09:00:00Z']}
				description="Description"
				palette="diaper"
				title="Title"
			/>,
		);

		const diaperDayCell = screen.getByTestId('yearly-cell-2024-01-02');
		expect(diaperDayCell).toHaveClass('bg-amber-600');
	});
});
