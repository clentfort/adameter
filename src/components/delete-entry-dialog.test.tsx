import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteEntryDialog from './delete-entry-dialog'; // Adjust path as necessary

// Mock fbtee for <fbt> calls
vi.mock('fbtee/react', async (importOriginal) => {
	const mod = await importOriginal<typeof import('fbtee/react')>();
	return {
		...mod,
		fbt: ({ children }: { children: React.ReactNode }) => children,
	};
});

describe('DeleteEntryDialog', () => {
	const mockOnClose = vi.fn();
	const mockOnDelete = vi.fn();
	const testEntryId = 'test-id-123';

	beforeEach(() => {
		// Reset mocks before each test
		mockOnClose.mockClear();
		mockOnDelete.mockClear();
	});

	it('should render the dialog with correct title and description', () => {
		render(
			<DeleteEntryDialog
				entry={testEntryId}
				onClose={mockOnClose}
				onDelete={mockOnDelete}
			/>,
		);

		expect(screen.getByText('Delete Entry')).toBeInTheDocument();
		expect(
			screen.getByText(
				'Do you really want to delete this entry? This action cannot be undone.',
			),
		).toBeInTheDocument();
		expect(screen.getByText('Cancel')).toBeInTheDocument();
		expect(screen.getByText('Delete')).toBeInTheDocument();
	});

	it('should call onDelete and onClose when Delete button is clicked', () => {
		render(
			<DeleteEntryDialog
				entry={testEntryId}
				onClose={mockOnClose}
				onDelete={mockOnDelete}
			/>,
		);

		fireEvent.click(screen.getByText('Delete'));

		expect(mockOnDelete).toHaveBeenCalledTimes(1);
		expect(mockOnDelete).toHaveBeenCalledWith(testEntryId);
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('should call onClose when Cancel button is clicked', () => {
		render(
			<DeleteEntryDialog
				entry={testEntryId}
				onClose={mockOnClose}
				onDelete={mockOnDelete}
			/>,
		);

		fireEvent.click(screen.getByText('Cancel'));

		expect(mockOnClose).toHaveBeenCalledTimes(1);
		expect(mockOnDelete).not.toHaveBeenCalled();
	});

	// Test for closing via overlay or escape key.
	// Radix UI's AlertDialog handles this. The `onOpenChange` prop on Dialog/AlertDialog
	// is called when the dialog's open state is requested to change, e.g. by Esc or overlay click.
	// Our component calls `onClose()` when `onOpenChange` is triggered with `open = false`.
	it('should call onClose when onOpenChange is triggered with open=false (simulating Esc/overlay click)', () => {
		const { rerender } = render(
			<DeleteEntryDialog
				entry={testEntryId}
				onClose={mockOnClose}
				onDelete={mockOnDelete}
			/>,
		);

		// To simulate onOpenChange, we can find the AlertDialog component in the tree
		// and manually call its onOpenChange prop if it were exposed, or more simply,
		// we can assume Radix works correctly and our component's wiring is the key.
		// The DeleteEntryDialog uses <AlertDialog onOpenChange={(open) => !open && onClose()} open={true}>
		// We can't directly trigger this from the outside easily without deep querying Radix internals.
		// However, if we simulate the Esc key press on the document, Radix should handle it.
		
		// Simulate pressing the Escape key
        // The "dialog" role is usually on the content element.
        const dialogContent = screen.getByRole('alertdialog'); // Radix uses role="alertdialog"
        fireEvent.keyDown(dialogContent, { key: 'Escape', code: 'Escape' });


		// Because onOpenChange is passed to Radix's AlertDialog, and our component's
		// onOpenChange is `(open) => !open && onClose()`, when Radix calls it with `false`
		// (due to Esc or overlay click), our `onClose` should be invoked.
		// The fireEvent.keyDown above should trigger Radix's internal handler, which then calls our onOpenChange.
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});
});
