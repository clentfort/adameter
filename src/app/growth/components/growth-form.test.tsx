import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import MeasurementForm from './growth-form';

const mockUseUnitSystem = vi.fn(() => ['metric', vi.fn()]);

vi.mock('@/hooks/use-unit-system', () => ({
	useUnitSystem: () => mockUseUnitSystem(),
}));

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
		mockUseUnitSystem.mockReturnValue(['metric', vi.fn()]);
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

	it('converts correctly between metric and imperial units', async () => {
		mockUseUnitSystem.mockReturnValue(['imperial', vi.fn()]);

		const existingMeasurement = {
			date: '2025-01-01T12:00:00Z',
			headCircumference: 35,
			height: 50,
			id: '123',
			notes: 'Existing notes',
			weight: 3500,
		};

		render(
			<MeasurementForm
				{...baseProps}
				measurement={existingMeasurement}
				title="Edit Measurement"
			/>,
		);

		// Verify initial display values in imperial (rounded to one decimal place)
		const weightInput = screen.getByLabelText(/weight \(lbs\)/i);
		const heightInput = screen.getByLabelText(/height \(in\)/i);
		const headCircumferenceInput = screen.getByLabelText(
			/head circumference \(in\)/i,
		);

		expect(weightInput).toHaveValue(7.7); // 3500g / 453.59237 = 7.716...
		expect(heightInput).toHaveValue(19.7); // 50cm / 2.54 = 19.685...
		expect(headCircumferenceInput).toHaveValue(13.8); // 35cm / 2.54 = 13.779...

		// Change weight to 8.0 lbs
		fireEvent.change(weightInput, { target: { value: '8.0' } });

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedMeasurement = mockOnSave.mock.calls[0][0];

		// 8.0 lbs * 453.59237 = 3628.73896, rounded to 3629
		expect(savedMeasurement.weight).toBe(3629);
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});

	it('handles imperial conversions, validation errors, and NaN values when creating measurements', async () => {
		// 1. Validation error when submitting empty values
		mockUseUnitSystem.mockReturnValue(['metric', vi.fn()]);

		const { unmount } = render(<MeasurementForm {...baseProps} />);

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => {
			expect(
				screen.getByText(
					/please enter at least a weight, height, or head circumference/i,
				),
			).toBeInTheDocument();
		});
		expect(mockOnSave).not.toHaveBeenCalled();
		unmount();

		// 2. Imperial conversion for height/headCircumference, generating a new ID when no measurement is provided
		mockUseUnitSystem.mockReturnValue(['imperial', vi.fn()]);

		const { unmount: unmountImperial } = render(
			<MeasurementForm {...baseProps} />,
		);

		const heightInput = screen.getByLabelText(/height \(in\)/i);
		const headCircumferenceInput = screen.getByLabelText(
			/head circumference \(in\)/i,
		);

		fireEvent.change(heightInput, { target: { value: '20.0' } });
		fireEvent.change(headCircumferenceInput, { target: { value: '14.0' } });

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSave).toHaveBeenCalledTimes(1));
		const savedMeasurement = mockOnSave.mock.calls[0][0];

		// 20.0 inches * 2.54 = 50.8 cm
		expect(savedMeasurement.height).toBe(50.8);
		// 14.0 inches * 2.54 = 35.56 cm -> rounded to 35.6 cm
		expect(savedMeasurement.headCircumference).toBe(35.6);
		expect(typeof savedMeasurement.id).toBe('string');
		expect(savedMeasurement.id.length).toBeGreaterThan(0);
		expect(mockOnClose).toHaveBeenCalledTimes(1);
		unmountImperial();

		// 3. Handling NaN numeric fields in imperial mode without throwing
		const invalidMeasurement = {
			date: '2025-01-01T12:00:00Z',
			headCircumference: Number.NaN,
			height: Number.NaN,
			id: '123',
			notes: '',
			weight: Number.NaN,
		};

		render(
			<MeasurementForm
				{...baseProps}
				measurement={invalidMeasurement}
				title="Edit Measurement"
			/>,
		);

		expect(screen.getByLabelText(/weight \(lbs\)/i)).toHaveValue(null);
	});
});
