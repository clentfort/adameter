import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HistoryEntryCard } from './history-entry-card';

describe('HistoryEntryCard', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders children and formatted time', () => {
		render(
			<HistoryEntryCard formattedTime="12:34">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByText('12:34')).toBeInTheDocument();
		expect(screen.getByText('Test content')).toBeInTheDocument();
	});

	it('renders emoji when provided', () => {
		render(
			<HistoryEntryCard emoji="👶" formattedTime="12:34">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByText('👶')).toBeInTheDocument();
	});

	it('calls onEdit when edit button is clicked', () => {
		const onEdit = vi.fn();
		render(
			<HistoryEntryCard onEdit={onEdit}>
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const editButton = screen.getByRole('button', { name: /edit/i });
		fireEvent.click(editButton);

		expect(onEdit).toHaveBeenCalledTimes(1);
	});

	it('calls onDelete when delete button is clicked', () => {
		const onDelete = vi.fn();
		render(
			<HistoryEntryCard onDelete={onDelete}>
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const deleteButton = screen.getByRole('button', { name: /delete/i });
		fireEvent.click(deleteButton);

		expect(onDelete).toHaveBeenCalledTimes(1);
	});

	it('applies variant styles correctly', () => {
		const { container } = render(
			<HistoryEntryCard variant="diaper">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass('border-amber-200');
		expect(card).toHaveClass('bg-amber-50/50');
	});

	it('applies custom className and style', () => {
		const { container } = render(
			<HistoryEntryCard className="custom-class" style={{ opacity: 0.5 }}>
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		const card = container.firstChild as HTMLElement;
		expect(card).toHaveClass('custom-class');
		expect(card.style.opacity).toBe('0.5');
	});

	it('sets data-testid when provided', () => {
		render(
			<HistoryEntryCard data-testid="test-card">
				<p>Test content</p>
			</HistoryEntryCard>,
		);

		expect(screen.getByTestId('test-card')).toBeInTheDocument();
	});
});
