import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HistoryEntryCard from './history-entry-card';

describe('HistoryEntryCard', () => {
	it('renders header, formattedTime, and children', () => {
		render(
			<HistoryEntryCard
				formattedTime="10:00 AM"
				header="Test Header"
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			>
				<div>Test Children</div>
			</HistoryEntryCard>,
		);

		expect(screen.getByText('Test Header')).toBeInTheDocument();
		expect(screen.getByText('10:00 AM')).toBeInTheDocument();
		expect(screen.getByText('Test Children')).toBeInTheDocument();
	});

	it('applies accentColor style when provided', () => {
		const { container } = render(
			<HistoryEntryCard
				accentColor="#ff0000"
				header="Accent Header"
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>,
		);

		const card = container.querySelector(
			'[data-testid="history-entry-card"]',
		) as HTMLElement;
		expect(card).not.toBeNull();
		expect(card.style.borderLeftColor).toBe('rgb(255, 0, 0)');
		expect(card.style.borderLeftWidth).toBe('4px');
		expect(card.style.borderBottomColor).toBe(
			'color-mix(in srgb, rgb(255, 0, 0) 30%, transparent)',
		);
	});

	it('triggers onEdit and onDelete menu item callbacks', async () => {
		const user = userEvent.setup();
		const onEdit = vi.fn();
		const onDelete = vi.fn();

		render(
			<HistoryEntryCard
				extraActions={<button type="button">Extra Action</button>}
				header="Action Header"
				onDelete={onDelete}
				onEdit={onEdit}
			/>,
		);

		const actionsButton = screen.getByTestId('history-entry-actions');
		await user.click(actionsButton);

		expect(await screen.findByText('Extra Action')).toBeInTheDocument();

		const editItem = screen.getByText('Edit');
		await user.click(editItem);
		expect(onEdit).toHaveBeenCalledTimes(1);

		await user.click(actionsButton);
		const deleteItem = await screen.findByText('Delete');
		await user.click(deleteItem);
		expect(onDelete).toHaveBeenCalledTimes(1);
	});
});
