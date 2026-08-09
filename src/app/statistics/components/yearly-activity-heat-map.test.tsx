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

	it('renders without card wrapper when noCard prop is true', () => {
		render(<YearlyActivityHeatMap dates={[]} noCard={true} />);
		expect(screen.queryByText('Less')).toBeInTheDocument();
	});

	it('ignores invalid dates in input', () => {
		render(<YearlyActivityHeatMap dates={['invalid-date']} />);
		const todayCell = screen.getByTestId('yearly-cell-2024-06-15');
		expect(todayCell).toHaveAttribute('title', 'June 15th, 2024: 0');
	});

	it('renders all 4 contribution levels and maximum count 100% ratio', () => {
		render(
			<YearlyActivityHeatMap
				dates={[
					'2024-01-02T01:00:00Z',
					'2024-01-02T02:00:00Z',
					'2024-01-02T03:00:00Z',
					'2024-01-02T04:00:00Z', // 4 counts (maxCount)
					'2024-01-03T01:00:00Z', // 1 count (ratio 0.25 -> level 1)
					'2024-01-04T01:00:00Z',
					'2024-01-04T02:00:00Z', // 2 counts (ratio 0.5 -> level 2)
					'2024-01-05T01:00:00Z',
					'2024-01-05T02:00:00Z',
					'2024-01-05T03:00:00Z', // 3 counts (ratio 0.75 -> level 3)
				]}
			/>,
		);

		const maxCell = screen.getByTestId('yearly-cell-2024-01-02');
		const level1Cell = screen.getByTestId('yearly-cell-2024-01-03');
		const level2Cell = screen.getByTestId('yearly-cell-2024-01-04');
		const level3Cell = screen.getByTestId('yearly-cell-2024-01-05');

		expect(maxCell).toHaveClass('bg-left-breast');
		expect(level1Cell).toHaveClass('bg-left-breast/15');
		expect(level2Cell).toHaveClass('bg-left-breast/30');
		expect(level3Cell).toHaveClass('bg-left-breast/55');
	});
});
