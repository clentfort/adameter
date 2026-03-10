import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HistoryEntryCard } from './history-entry-card';

describe('HistoryEntryCard', () => {
	it('renders children correctly', () => {
		render(
			<HistoryEntryCard onDelete={vi.fn()} onEdit={vi.fn()}>
				<div data-testid="test-child">Test Content</div>
			</HistoryEntryCard>,
		);
		expect(screen.getByTestId('test-child')).toBeInTheDocument();
		expect(screen.getByText('Test Content')).toBeInTheDocument();
	});

	it('renders formattedTime as title when title prop is not provided', () => {
		render(
			<HistoryEntryCard
				formattedTime="12:00 PM"
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			>
				Content
			</HistoryEntryCard>,
		);
		const timeElement = screen.getByText('12:00 PM');
		expect(timeElement).toBeInTheDocument();
		expect(timeElement).toHaveClass('text-lg');
	});

	it('renders title and small formattedTime when both are provided', () => {
		render(
			<HistoryEntryCard
				formattedTime="12:00 PM"
				onDelete={vi.fn()}
				onEdit={vi.fn()}
				title="Main Title"
			>
				Content
			</HistoryEntryCard>,
		);
		expect(screen.getByText('Main Title')).toBeInTheDocument();
		const timeElement = screen.getByText('12:00 PM');
		expect(timeElement).toHaveClass('text-xs');
	});

	it('calls onEdit when edit button is clicked', async () => {
		const onEdit = vi.fn();
		render(
			<HistoryEntryCard onDelete={vi.fn()} onEdit={onEdit}>
				Content
			</HistoryEntryCard>,
		);

		const editButton = screen.getByRole('button', { name: /edit/i });
		await userEvent.click(editButton);

		expect(onEdit).toHaveBeenCalledTimes(1);
	});

	it('calls onDelete when delete button is clicked', async () => {
		const onDelete = vi.fn();
		render(
			<HistoryEntryCard onDelete={onDelete} onEdit={vi.fn()}>
				Content
			</HistoryEntryCard>,
		);

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await userEvent.click(deleteButton);

		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it('applies custom className and style', () => {
		const { container } = render(
			<HistoryEntryCard
				className="custom-class"
				onDelete={vi.fn()}
				onEdit={vi.fn()}
				style={{ opacity: 0.5 }}
			>
				Content
			</HistoryEntryCard>,
		);
		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass('custom-class');
		expect(card.style.opacity).toBe('0.5');
	});
});
