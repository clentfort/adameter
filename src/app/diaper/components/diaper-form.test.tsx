import type { DiaperChange } from '@/types/diaper';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DiaperForm from './diaper-form';

vi.mock('@/hooks/use-diaper-changes', () => ({
	useDiaperChanges: () => ({
		value: [],
	}),
}));

vi.mock('@/hooks/use-diaper-products', () => ({
	useDiaperProducts: () => ({
		add: vi.fn(),
		value: [
			{ id: '1', isReusable: false, name: 'Product 1' },
			{ id: '2', isReusable: true, name: 'Product 2' },
		],
	}),
}));

describe('DiaperForm', () => {
	const mockOnSave = vi.fn();
	const mockOnClose = vi.fn();

	const baseProps = {
		onClose: mockOnClose,
		onSave: mockOnSave,
		title: 'Add Diaper Change',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders with initial data and calls onSave when submitted', async () => {
		const initialChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			id: '1',
			leakage: false,
			notes: 'Some notes',
			pottyStool: false,
			pottyUrine: false,
			temperature: 37,
			timestamp: '2023-10-27T10:00:00.000Z',
		};

		render(<DiaperForm {...baseProps} change={initialChange} />);

		expect(screen.getByLabelText(/temperature/i)).toHaveValue(37);
		expect(screen.getByLabelText(/notes/i)).toHaveValue('Some notes');

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedChange = mockOnSave.mock.calls[0][0];
		expect(savedChange.containsStool).toBe(true);
		expect(savedChange.containsUrine).toBe(true);
		expect(savedChange.temperature).toBe(37);
		expect(savedChange.notes).toBe('Some notes');
		expect(savedChange.id).toBe('1');
	});

	it('allows toggling urine and stool', async () => {
		render(<DiaperForm {...baseProps} />);

		fireEvent.click(screen.getByTestId('toggle-diaper-urine'));
		fireEvent.click(screen.getByTestId('toggle-diaper-stool'));
		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedChange = mockOnSave.mock.calls[0][0];
		expect(savedChange.containsUrine).toBe(false);
		expect(savedChange.containsStool).toBe(true);
	});
});
