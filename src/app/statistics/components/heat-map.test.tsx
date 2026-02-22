import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import HeatMap from './heat-map';

const mockData = [
	// Spans 2 5-min intervals (00:00, 00:05)
	{
		endTime: new Date('2024-01-01T00:09:00Z').toISOString(),
		startTime: new Date('2024-01-01T00:00:00Z').toISOString(),
	},
	// Spans 2 5-min intervals (00:05, 00:10)
	{
		endTime: new Date('2024-01-01T00:14:00Z').toISOString(),
		startTime: new Date('2024-01-01T00:05:00Z').toISOString(),
	},
	// Spans 2 5-min intervals (23:55 day 1, 00:00 day 2)
	{
		endTime: new Date('2024-01-02T00:04:00Z').toISOString(),
		startTime: new Date('2024-01-01T23:55:00Z').toISOString(),
	},
];

describe('HeatMap', () => {
	it('renders null when no data is provided', () => {
		const { container } = render(
			<HeatMap data={[]} description="Desc" title="Title" />,
		);
		expect(container.firstChild).toBeNull();
	});

	it('renders the heat map with correct title and description', () => {
		const { getByText } = render(
			<HeatMap data={mockData} description="Test Description" title="Test Title" />,
		);
		expect(getByText('Test Title')).toBeInTheDocument();
		expect(getByText('Test Description')).toBeInTheDocument();
	});

	it('renders the heat map with correct number of interval divs', () => {
		const { container } = render(
			<HeatMap data={mockData} description="Desc" title="Title" />,
		);
		const intervalContainer = container.querySelector('.absolute.top-0.left-0.right-0.h-8.flex');
		expect(intervalContainer).not.toBeNull();
		if (intervalContainer) {
			expect(intervalContainer.children.length).toBe(288);
		}
	});

	it('renders time markers and legend', () => {
		const { getAllByText, getByText } = render(
			<HeatMap data={mockData} description="Desc" title="Title" />,
		);

		expect(getAllByText('00:00')[0]).toBeInTheDocument();
		expect(getByText('12:00')).toBeInTheDocument();
		expect(getByText('24:00')).toBeInTheDocument();

		expect(getByText('Less')).toBeInTheDocument();
		expect(getByText('More')).toBeInTheDocument();
	});

	it('applies different background colors based on intensity', () => {
		const { container } = render(
			<HeatMap data={mockData} description="Desc" palette="feeding" title="Title" />,
		);

		const intervalContainer = container.querySelector('.absolute.top-0.left-0.right-0.h-8.flex');
		expect(intervalContainer).not.toBeNull();
		if (intervalContainer) {
			// Interval 0 (00:00): 2 hits (from session 1 and session 3) -> maxCount is 2
			// intensity 1.0 -> level 9 -> bg-right-breast
			expect(intervalContainer.children[0]).toHaveClass('bg-right-breast');

			// Interval 2 (00:10): 1 hit -> intensity 0.5 -> level 5 -> bg-right-breast/30
			expect(intervalContainer.children[2]).toHaveClass('bg-right-breast/30');

			// Interval 3 (00:15): 0 hits -> level 0 -> bg-muted/60
			expect(intervalContainer.children[3]).toHaveClass('bg-muted/60');
		}
	});

	afterEach(() => {
		cleanup();
	});
});
