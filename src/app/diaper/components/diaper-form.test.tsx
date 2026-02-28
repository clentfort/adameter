import type { DiaperChange } from '@/types/diaper';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DiaperForm from './diaper-form';

// Mock useDiaperProducts hook
vi.mock('@/hooks/use-diaper-products', () => ({
	useDiaperProducts: () => ({
		add: vi.fn(),
		value: [
			{ id: '1', name: 'Product 1', costPerDiaper: 0.5, isReusable: false },
			{ id: '2', name: 'Product 2', costPerDiaper: 0.1, isReusable: true },
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
			timestamp: '2023-10-27T10:00:00.000Z',
			pottyStool: false,
			pottyUrine: false,
			leakage: false,
			temperature: 37.0,
			abnormalities: 'Some notes'
		};

		render(<DiaperForm {...baseProps} change={initialChange} />);

		// Check if initial values are set correctly
		// Temperature is in an input
		expect(screen.getByLabelText(/Temperature/i)).toHaveValue(37.0);
		expect(screen.getByLabelText(/Notes/i)).toHaveValue('Some notes');

		// Find the save button and click it
		const saveButton = screen.getByTestId('save-button');
		fireEvent.click(saveButton);

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedChange = mockOnSave.mock.calls[0][0];
		expect(savedChange.containsStool).toBe(true);
		expect(savedChange.containsUrine).toBe(true);
		expect(savedChange.temperature).toBe(37.0);
		expect(savedChange.abnormalities).toBe('Some notes');
		expect(savedChange.id).toBe('1');
	});

	it('allows toggling urine and stool', async () => {
		render(<DiaperForm {...baseProps} />);

		const urineToggle = screen.getByTestId('toggle-diaper-urine');
		const stoolToggle = screen.getByTestId('toggle-diaper-stool');

		// Initial state (Add mode with no presetType)
		// Default: urine=true, stool=false (based on current implementation)

		fireEvent.click(urineToggle); // set to false
		fireEvent.click(stoolToggle); // set to true

		const saveButton = screen.getByTestId('save-button');
		fireEvent.click(saveButton);

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedChange = mockOnSave.mock.calls[0][0];
		expect(savedChange.containsUrine).toBe(false);
		expect(savedChange.containsStool).toBe(true);
	});
});
