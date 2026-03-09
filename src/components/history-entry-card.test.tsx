import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HistoryEntryCard } from './history-entry-card';

describe('HistoryEntryCard', () => {
	it('renders children correctly', () => {
		render(
			<HistoryEntryCard>
				<div data-testid="test-child">Test Content</div>
			</HistoryEntryCard>,
		);
		expect(screen.getByTestId('test-child')).toBeInTheDocument();
		expect(screen.getByText('Test Content')).toBeInTheDocument();
	});

	it('renders formattedTime as title when title prop is not provided', () => {
		render(<HistoryEntryCard formattedTime="12:00 PM">Content</HistoryEntryCard>);
		const timeElement = screen.getByText('12:00 PM');
		expect(timeElement).toBeInTheDocument();
		expect(timeElement).toHaveClass('text-lg');
	});

	it('renders title and small formattedTime when both are provided', () => {
		render(
			<HistoryEntryCard formattedTime="12:00 PM" title="Main Title">
				Content
			</HistoryEntryCard>,
		);
		expect(screen.getByText('Main Title')).toBeInTheDocument();
		const timeElement = screen.getByText('12:00 PM');
		expect(timeElement).toHaveClass('text-xs');
	});

	it('renders emoji correctly', () => {
		render(<HistoryEntryCard emoji="👶">Content</HistoryEntryCard>);
		expect(screen.getByText('👶')).toBeInTheDocument();
	});

	it('applies variant styles correctly with subtle borders', () => {
		const { container } = render(
			<HistoryEntryCard variant="diaper">Content</HistoryEntryCard>,
		);
		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass('border-amber-200/50');
		expect(card).toHaveClass('bg-amber-50/50');
	});

	it('calls onEdit when edit button is clicked', async () => {
		const onEdit = vi.fn();
		render(<HistoryEntryCard onEdit={onEdit}>Content</HistoryEntryCard>);

		const editButton = screen.getByRole('button', { name: /edit/i });
		await userEvent.click(editButton);

		expect(onEdit).toHaveBeenCalledTimes(1);
	});

	it('calls onDelete when delete button is clicked', async () => {
		const onDelete = vi.fn();
		render(<HistoryEntryCard onDelete={onDelete}>Content</HistoryEntryCard>);

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		await userEvent.click(deleteButton);

		expect(onDelete).toHaveBeenCalledTimes(1);
	});
});
