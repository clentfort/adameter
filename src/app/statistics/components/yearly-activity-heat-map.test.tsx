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

		// maxCount = 2. count 2 -> ratio 1.0 -> level 9
		expect(busyDayCell).toHaveClass('bg-left-breast');
		// maxCount = 2. count 1 -> ratio 0.5 -> level 5
		expect(lightDayCell).toHaveClass('bg-left-breast/50');
		expect(prevYearDayCell).toHaveClass('bg-left-breast/50');
	});

	it('includes data from exactly one year ago but not further', () => {
		// Today is 2024-06-15
		// One year ago is 2023-06-15

		render(
			<YearlyActivityHeatMap
				dates={[
					'2023-06-15T10:00:00Z', // Exactly one year ago
					'2023-06-14T10:00:00Z', // One year and one day ago
				]}
				description="Description"
				title="Title"
			/>,
		);

		const inRangeCell = screen.getByTestId('yearly-cell-2023-06-15');
		const outOfRangeCell = screen.getByTestId('yearly-cell-2023-06-14');

		expect(inRangeCell).toHaveAttribute('title', 'June 15th, 2023: 1');
		expect(outOfRangeCell).toHaveAttribute('title', 'June 14th, 2023: 0');

		// With only one entry, count 1 is the maximum, so it gets level 9 (highest intensity)
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
		// maxCount = 1. count 1 -> ratio 1.0 -> level 9
		expect(diaperDayCell).toHaveClass('bg-amber-800');
	});
});
