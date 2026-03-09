import type { Tooth } from '@/types/teething';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TeethingForm from './teething-form';

describe('TeethingForm', () => {
	const mockOnSave = vi.fn();
	const mockOnClose = vi.fn();

	const tooth: Tooth = {
		toothId: '51',
	};

	const baseProps = {
		onClose: mockOnClose,
		onSave: mockOnSave,
		tooth,
		toothName: 'Upper Left Central Incisor',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders correctly and calls onSave when submitted', async () => {
		render(<TeethingForm {...baseProps} />);

		const notesInput = screen.getByLabelText(/notes/i);
		fireEvent.change(notesInput, { target: { value: 'First tooth!' } });

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedTooth = mockOnSave.mock.calls[0][0];
		expect(savedTooth.notes).toBe('First tooth!');
		expect(savedTooth.toothId).toBe('51');
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});
});
