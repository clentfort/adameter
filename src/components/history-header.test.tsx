import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HistoryHeader from './history-header';

describe('HistoryHeader', () => {
	it('renders title and triggers onAddEntry when button is clicked', async () => {
		const user = userEvent.setup();
		const handleAddEntry = vi.fn();

		render(
			<HistoryHeader onAddEntry={handleAddEntry} title="Diaper History" />,
		);

		expect(
			screen.getByRole('heading', { level: 2, name: 'Diaper History' }),
		).toBeInTheDocument();
		expect(screen.queryByText('Select Timeframe')).not.toBeInTheDocument();

		const addButton = screen.getByRole('button', { name: /add entry/i });
		await user.click(addButton);

		expect(handleAddEntry).toHaveBeenCalledTimes(1);
	});

	it('renders HistoryRangeSelector when onRangeChange is provided', () => {
		const handleAddEntry = vi.fn();
		const handleRangeChange = vi.fn();

		render(
			<HistoryHeader
				from="2023-01-01T00:00:00.000Z"
				onAddEntry={handleAddEntry}
				onRangeChange={handleRangeChange}
				title="Feeding History"
				to="2023-01-07T23:59:59.999Z"
			/>,
		);

		expect(screen.getByText('Select Timeframe')).toBeInTheDocument();
	});
});
