import type { FeedingSession } from '@/types/feeding';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FeedingForm from './feeding-form';

describe('FeedingForm', () => {
	const mockOnSave = vi.fn();
	const mockOnClose = vi.fn();

	const baseProps = {
		onClose: mockOnClose,
		onSave: mockOnSave,
		title: 'Edit Feeding',
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders with initial data and calls onSave when submitted', () => {
		const initialFeeding: FeedingSession = {
			breast: 'left',
			durationInSeconds: 600, // 10 minutes
			endTime: '2023-10-27T10:10:00.000Z',
			id: '1',
			startTime: '2023-10-27T10:00:00.000Z',
		};

		render(<FeedingForm {...baseProps} feeding={initialFeeding} />);

		// Check if initial values are set
		expect(screen.getByLabelText(/minutes/i)).toHaveValue(10);

		// Find the save button and click it
		const saveButton = screen.getByTestId('save-button');
		fireEvent.click(saveButton);

		expect(mockOnSave).toHaveBeenCalledTimes(1);
		const savedSession = mockOnSave.mock.calls[0][0];
		expect(savedSession.breast).toBe('left');
		expect(savedSession.durationInSeconds).toBe(600);
		expect(savedSession.id).toBe('1');
	});

	it('renders without initial data and allows saving new session', () => {
		render(<FeedingForm {...baseProps} />);

		// Default should be left breast
		expect(screen.getByLabelText(/minutes/i)).toHaveValue(null);

		fireEvent.click(screen.getByTestId('right-breast-radio'));
		fireEvent.change(screen.getByLabelText(/minutes/i), { target: { value: '15' } });

		fireEvent.click(screen.getByTestId('save-button'));

		expect(mockOnSave).toHaveBeenCalledTimes(1);
		const savedSession = mockOnSave.mock.calls[0][0];
		expect(savedSession.breast).toBe('right');
		expect(savedSession.durationInSeconds).toBe(900);
	});

	it('does not call onSave if duration is invalid', () => {
		render(<FeedingForm {...baseProps} />);

		fireEvent.change(screen.getByLabelText(/minutes/i), { target: { value: '' } });
		fireEvent.click(screen.getByTestId('save-button'));

		expect(mockOnSave).not.toHaveBeenCalled();
	});
});
