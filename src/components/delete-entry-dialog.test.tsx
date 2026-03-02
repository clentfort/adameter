import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DeleteEntryDialog from './delete-entry-dialog';

describe('DeleteEntryDialog', () => {
	afterEach(() => {
		cleanup();
	});

	it('renders and calls onDelete and onClose when Delete button is clicked', () => {
		const mockOnDelete = vi.fn();
		const mockOnClose = vi.fn();
		const entryId = 'test-id-123';

		render(
			<DeleteEntryDialog
				entry={entryId}
				onClose={mockOnClose}
				onDelete={mockOnDelete}
			/>,
		);

		// Verify title and description
		expect(screen.getByText(/Delete Entry/i)).toBeInTheDocument();
		expect(
			screen.getByText(/Do you really want to delete this entry?/i),
		).toBeInTheDocument();

		// Click the Delete button
		const deleteButton = screen.getByRole('button', { name: /^Delete$/i });
		fireEvent.click(deleteButton);

		// Verify callbacks were called
		expect(mockOnDelete).toHaveBeenCalledWith(entryId);
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('calls onClose when Cancel button is clicked', () => {
		const mockOnDelete = vi.fn();
		const mockOnClose = vi.fn();

		render(
			<DeleteEntryDialog
				entry="id"
				onClose={mockOnClose}
				onDelete={mockOnDelete}
			/>,
		);

		const cancelButton = screen.getByRole('button', { name: /Cancel/i });
		fireEvent.click(cancelButton);

		expect(mockOnClose).toHaveBeenCalledTimes(1);
		expect(mockOnDelete).not.toHaveBeenCalled();
	});
});
