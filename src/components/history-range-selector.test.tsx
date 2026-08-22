import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HistoryRangeSelector from './history-range-selector';

describe('HistoryRangeSelector', () => {
	it('renders default timeframe trigger and handles default fallback range', async () => {
		const user = userEvent.setup();
		const handleRangeChange = vi.fn();

		render(<HistoryRangeSelector onRangeChange={handleRangeChange} />);

		const triggerBtn = screen.getByRole('button', { name: /select timeframe/i });
		expect(triggerBtn).toBeInTheDocument();

		await user.click(triggerBtn);

		expect(screen.getByText('Timeframe')).toBeInTheDocument();
		expect(
			screen.getByText('Select a range to filter history.'),
		).toBeInTheDocument();

		const fromInput = screen.getByLabelText(/from/i) as HTMLInputElement;
		const toInput = screen.getByLabelText(/to/i) as HTMLInputElement;

		expect(fromInput.value).not.toBe('');
		expect(toInput.value).not.toBe('');

		const applyBtn = screen.getByRole('button', { name: /apply/i });
		await user.click(applyBtn);

		expect(handleRangeChange).toHaveBeenCalledTimes(1);
	});

	it('uses provided dates, updates custom range inputs, and triggers onRangeChange on apply', async () => {
		const user = userEvent.setup();
		const handleRangeChange = vi.fn();

		const { rerender } = render(
			<HistoryRangeSelector
				from="2023-01-01T00:00:00.000Z"
				onRangeChange={handleRangeChange}
				to="2023-01-07T23:59:59.999Z"
			/>,
		);

		const triggerBtn = screen.getByRole('button', { name: /select timeframe/i });
		await user.click(triggerBtn);

		let fromInput = screen.getByLabelText(/from/i) as HTMLInputElement;
		let toInput = screen.getByLabelText(/to/i) as HTMLInputElement;

		expect(fromInput.value).toBe('2023-01-01');
		expect(toInput.value).toBe('2023-01-07');

		await user.clear(fromInput);
		await user.type(fromInput, '2023-02-01');

		await user.clear(toInput);
		await user.type(toInput, '2023-02-10');

		const applyBtn = screen.getByRole('button', { name: /apply/i });
		await user.click(applyBtn);

		expect(handleRangeChange).toHaveBeenCalledTimes(1);
		expect(handleRangeChange).toHaveBeenCalledWith(
			new Date('2023-02-01').toISOString(),
			new Date('2023-02-10').toISOString(),
		);

		// Test useEffect synchronization when props update
		rerender(
			<HistoryRangeSelector
				from="2023-05-01T00:00:00.000Z"
				onRangeChange={handleRangeChange}
				to="2023-05-15T23:59:59.999Z"
			/>,
		);

		await user.click(triggerBtn);
		fromInput = screen.getByLabelText(/from/i) as HTMLInputElement;
		toInput = screen.getByLabelText(/to/i) as HTMLInputElement;

		expect(fromInput.value).toBe('2023-05-01');
		expect(toInput.value).toBe('2023-05-15');
	});
});
