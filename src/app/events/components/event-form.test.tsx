import type { Event } from '@/types/event';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/contexts/i18n-context';
import EventForm from './event-form';

function TestWrapper({ children }: { children: React.ReactNode }) {
	return <I18nProvider>{children}</I18nProvider>;
}

describe('EventForm', () => {
	const mockOnClose = vi.fn();
	const mockOnSave = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers({ shouldAdvanceTime: true });
		vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('renders with default values for adding a new event and submits', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

		render(
			<TestWrapper>
				<EventForm onClose={mockOnClose} onSave={mockOnSave} title="Add Event" />
			</TestWrapper>,
		);

		expect(screen.getByText('Add Event')).toBeInTheDocument();

		const titleInput = screen.getByLabelText(/title/i);
		await user.type(titleInput, 'Vaccination');

		const notesInput = screen.getByLabelText(/description \(optional\)/i);
		await user.type(notesInput, 'First dose');

		// Select a color swatch button
		const colorButtons = screen.getAllByRole('button', { name: /farbe/i });
		await user.click(colorButtons[1]); // '#ec4899'

		// Submit form
		const saveButton = screen.getByRole('button', { name: /save/i });
		await user.click(saveButton);

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledTimes(1);
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		const savedEvent = mockOnSave.mock.calls[0][0] as Event;
		expect(savedEvent.title).toBe('Vaccination');
		expect(savedEvent.notes).toBe('First dose');
		expect(savedEvent.type).toBe('point');
		expect(savedEvent.color).toBe('#ec4899');
		expect(savedEvent.id).toBeDefined();
	});

	it('renders with existing event for editing, supports period event type and end date switch', async () => {
		const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

		const existingEvent: Event = {
			color: '#10b981',
			endDate: '2024-01-18T10:00:00Z',
			id: 'event-123',
			notes: 'Existing notes',
			startDate: '2024-01-15T10:00:00Z',
			title: 'Existing Illness',
			type: 'period',
		};

		render(
			<TestWrapper>
				<EventForm
					event={existingEvent}
					onClose={mockOnClose}
					onSave={mockOnSave}
					title="Edit Event"
				/>
			</TestWrapper>,
		);

		expect(screen.getByText('Edit Event')).toBeInTheDocument();
		expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Illness');
		expect(screen.getByLabelText(/description \(optional\)/i)).toHaveValue(
			'Existing notes',
		);

		// Switch event type from period to point
		const pointRadio = screen.getByTestId('point-event-radio');
		await user.click(pointRadio);

		// End date switch should disappear
		expect(
			screen.queryByTestId('has-end-date-switch'),
		).not.toBeInTheDocument();

		// Switch back to period
		const periodRadio = screen.getByTestId('period-event-radio');
		await user.click(periodRadio);

		// End date switch should reappear
		const endDateSwitch = screen.getByTestId('has-end-date-switch');
		expect(endDateSwitch).toBeInTheDocument();

		// Toggle end date off and back on
		await user.click(endDateSwitch);
		await user.click(endDateSwitch);

		// Submit form
		const saveButton = screen.getByRole('button', { name: /save/i });
		await user.click(saveButton);

		await waitFor(() => {
			expect(mockOnSave).toHaveBeenCalledTimes(1);
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});

		const savedEvent = mockOnSave.mock.calls[0][0] as Event;
		expect(savedEvent.id).toBe('event-123');
		expect(savedEvent.title).toBe('Existing Illness');
		expect(savedEvent.type).toBe('period');
		expect(savedEvent.color).toBe('#10b981');
	});
});
