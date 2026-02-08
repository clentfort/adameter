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

		expect(busyDayCell).toHaveAttribute('title', 'January 2nd, 2024: 2');
		expect(lightDayCell).toHaveAttribute('title', 'January 3rd, 2024: 1');
		expect(busyDayCell).toHaveClass('bg-left-breast');
		expect(lightDayCell).toHaveClass('bg-left-breast/30');
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
