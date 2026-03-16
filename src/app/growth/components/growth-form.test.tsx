import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MeasurementForm from './growth-form';

describe('MeasurementForm', () => {
	const mockOnSave = vi.fn();
	const mockOnClose = vi.fn();

	const baseProps = {
		onClose: mockOnClose,
		onSave: mockOnSave,
		title: 'Add Measurement',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders correctly and calls onSave with numeric data when submitted', async () => {
		render(<MeasurementForm {...baseProps} />);

		const weightInput = screen.getByLabelText(/weight \(g\)/i);
		const heightInput = screen.getByLabelText(/height \(cm\)/i);
		const headCircumferenceInput = screen.getByLabelText(
			/head circumference \(cm\)/i,
		);
		const notesInput = screen.getByLabelText(/notes/i);

		fireEvent.change(weightInput, { target: { value: '3500' } });
		fireEvent.change(heightInput, { target: { value: '50.5' } });
		fireEvent.change(headCircumferenceInput, { target: { value: '35.2' } });
		fireEvent.change(notesInput, { target: { value: 'Healthy baby' } });

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedMeasurement = mockOnSave.mock.calls[0][0];
		expect(savedMeasurement.weight).toBe(3500);
		expect(savedMeasurement.height).toBe(50.5);
		expect(savedMeasurement.headCircumference).toBe(35.2);
		expect(savedMeasurement.notes).toBe('Healthy baby');
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});
});
