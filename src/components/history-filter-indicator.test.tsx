import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HistoryFilterIndicator from './history-filter-indicator';

describe('HistoryFilterIndicator', () => {
	it('renders correctly with various configurations for maximum coverage', () => {
		// Scenario 1: With eventTitle, multi-day range, and custom color
		const { rerender } = render(
			<HistoryFilterIndicator
				baseUrl="/test-base"
				color="#ff0000"
				eventTitle="Test Event"
				from="2023-10-01T00:00:00.000Z"
				to="2023-10-07T00:00:00.000Z"
			/>,
		);

		expect(
			screen.getByText(/Viewing related activity for Test Event/),
		).toBeInTheDocument();
		expect(
			screen.getByText((content) => content.includes('01.10.2023')),
		).toBeInTheDocument();
		expect(
			screen.getByText((content) => content.includes('07.10.2023')),
		).toBeInTheDocument();

		const clearLink = screen.getByRole('link', { name: /Clear Filter/ });
		expect(clearLink).toHaveAttribute('href', '/test-base');

		const container1 = screen.getByText(
			/Viewing related activity for Test Event/,
		).parentElement?.parentElement;
		expect(container1).toHaveStyle({ 'border-left-color': 'rgb(255, 0, 0)' });

		// Scenario 2: Without eventTitle and single-day range
		rerender(
			<HistoryFilterIndicator
				baseUrl="/test-base"
				from="2023-10-01T10:00:00.000Z"
				to="2023-10-01T20:00:00.000Z"
			/>,
		);

		expect(screen.getByText(/Viewing filtered timeframe/)).toBeInTheDocument();
		expect(
			screen.getByText((content) => content.includes('01.10.2023')),
		).toBeInTheDocument();
		const container2 = screen.getByText(/Viewing filtered timeframe/)
			.parentElement?.parentElement;
		expect(container2).toHaveStyle({
			'border-left-color': 'var(--color-primary)',
		});
	});
});
