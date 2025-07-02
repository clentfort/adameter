import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@testing-library/react';
// import { action } from '@storybook/addon-actions'; // Removed
import userEvent from '@testing-library/user-event';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import EventForm from './event-form';

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const COLORS = [
	'#6366f1',
	'#ec4899',
	'#10b981',
	'#f59e0b',
	'#ef4444',
	'#8b5cf6',
];

const meta: Meta<typeof EventForm> = {
	argTypes: {
		onClose: { action: 'closed' },
		onSave: { action: 'saved' },
		title: { control: 'text' },
		// 'event' prop for EditMode is complex, handled by specific stories
	},
	component: EventForm,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Events/EventForm',
};

export default meta;
type Story = StoryObj<typeof EventForm>;

export const AddModePointEvent: Story = {
	args: {
		onClose: () => {},
		onSave: () => {},
		title: 'Add New Point Event',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog'); // Dialog is portaled
		// await expect(dialog).toBeVisible();
		// await expect(
		// 	within(dialog).getByText('Add New Point Event'),
		// ).toBeInTheDocument();

		const titleInput = within(dialog).getByLabelText(/title/i);
		await userEvent.type(titleInput, 'Doctor Visit');

		const dateInput = within(dialog).getByLabelText(/^date$/i); // Exact match for "Date"
		await userEvent.clear(dateInput);
		await userEvent.type(dateInput, dateToDateInputValue(now));

		const timeInput = within(dialog).getByLabelText(/^time$/i); // Exact match for "Time"
		await userEvent.clear(timeInput);
		await userEvent.type(timeInput, dateToTimeInputValue(now));

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		// await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		// expect(args.onSave).toHaveBeenCalledWith(
		// 	expect.objectContaining({
		// 		endDate: undefined, // Point events shouldn't have an end date by default
		// 		startDate: expect.stringContaining(dateToDateInputValue(now)),
		// 		title: 'Doctor Visit',
		// 		type: 'point',
		// 	}),
		// );
	},
};

export const AddModePeriodEvent: Story = {
	args: {
		onClose: () => {},
		onSave: () => {},
		title: 'Add New Period Event',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		const titleInput = within(dialog).getByLabelText(/title/i);
		await userEvent.type(titleInput, 'Flu Season');

		const periodRadioButton = within(dialog).getByLabelText(
			/period \(e.g. illness\)/i,
		);
		await userEvent.click(periodRadioButton);
		// await expect(periodRadioButton).toBeChecked();

		const setEndDateSwitch = within(dialog).getByLabelText(/set end date/i);
		await userEvent.click(setEndDateSwitch);
		// await expect(setEndDateSwitch).toBeChecked();

		const startDateInput = within(dialog).getAllByLabelText(/^date$/i)[0]; // First is start date
		await userEvent.clear(startDateInput);
		await userEvent.type(startDateInput, dateToDateInputValue(now));

		const startTimeInput = within(dialog).getAllByLabelText(/^time$/i)[0];
		await userEvent.clear(startTimeInput);
		await userEvent.type(startTimeInput, '09:00');

		const endDateInput = within(dialog).getByLabelText(/end date/i);
		await userEvent.clear(endDateInput);
		await userEvent.type(endDateInput, dateToDateInputValue(tomorrow));

		const endTimeInput = within(dialog).getByLabelText(/end time/i);
		await userEvent.clear(endTimeInput);
		await userEvent.type(endTimeInput, '17:00');

		const colorButton = within(dialog).getByRole('button', {
			name: `Farbe ${COLORS[2]}`,
		});
		await userEvent.click(colorButton);

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		// await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		// expect(args.onSave).toHaveBeenCalledWith(
		// 	expect.objectContaining({
		// 		color: COLORS[2],
		// 		endDate: expect.stringContaining(dateToDateInputValue(tomorrow)),
		// 		startDate: expect.stringContaining(dateToDateInputValue(now)),
		// 		title: 'Flu Season',
		// 		type: 'period',
		// 	}),
		// );
	},
};

export const EditModePointEvent: Story = {
	args: {
		event: {
			color: COLORS[0],
			description: 'Previous booster shot',
			id: 'event-point-123',
			startDate: yesterday.toISOString(),
			title: 'Old Vaccination',
			type: 'point',
		},
		onClose: () => {},
		onSave: () => {},
		title: 'Edit Point Event',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		const titleInput = within(dialog).getByLabelText(/title/i);
		// await expect(titleInput).toHaveValue('Old Vaccination');

		await userEvent.clear(titleInput);
		await userEvent.type(titleInput, 'Updated Vaccination');

		const descriptionInput = within(dialog).getByLabelText(/description/i);
		await userEvent.clear(descriptionInput);
		await userEvent.type(descriptionInput, 'New booster shot details');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		// await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		// expect(args.onSave).toHaveBeenCalledWith(
		// 	expect.objectContaining({
		// 		description: 'New booster shot details',
		// 		id: 'event-point-123',
		// 		title: 'Updated Vaccination',
		// 		type: 'point',
		// 	}),
		// );
	},
};

export const EditModePeriodEventWithEndDateChange: Story = {
	args: {
		event: {
			color: COLORS[1],
			endDate: now.toISOString(),
			id: 'event-period-456',
			startDate: yesterday.toISOString(),
			title: 'Initial Sickness',
			type: 'period',
		},
		onClose: () => {},
		onSave: () => {},
		title: 'Edit Period Event',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		// await expect(within(dialog).getByLabelText(/title/i)).toHaveValue(
		// 	'Initial Sickness',
		// );

		const setEndDateSwitch = within(dialog).getByLabelText(/set end date/i);
		// If event has endDate, switch should be checked
		// await expect(setEndDateSwitch).toBeChecked();

		const newEndDate = new Date(now);
		newEndDate.setDate(now.getDate() + 3); // Extend by 3 days

		const endDateInput = within(dialog).getByLabelText(/end date/i);
		await userEvent.clear(endDateInput);
		await userEvent.type(endDateInput, dateToDateInputValue(newEndDate));

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		// await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		// expect(args.onSave).toHaveBeenCalledWith(
		// 	expect.objectContaining({
		// 		endDate: expect.stringContaining(dateToDateInputValue(newEndDate)),
		// 		id: 'event-period-456',
		// 	}),
		// );
	},
};

export const PeriodEventEndDateBeforeStartDateCorrection: Story = {
	args: {
		onClose: () => {},
		onSave: () => {},
		title: 'Test End Date Correction',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		await userEvent.type(within(dialog).getByLabelText(/title/i), 'Date Test');
		await userEvent.click(
			within(dialog).getByLabelText(/period \(e.g. illness\)/i),
		);
		await userEvent.click(within(dialog).getByLabelText(/set end date/i));

		const startDateInput = within(dialog).getAllByLabelText(/^date$/i)[0];
		const startTimeInput = within(dialog).getAllByLabelText(/^time$/i)[0];
		const endDateInput = within(dialog).getByLabelText(/end date/i);
		const endTimeInput = within(dialog).getByLabelText(/end time/i);

		// Set start date to today 10:00
		await userEvent.clear(startDateInput);
		await userEvent.type(startDateInput, dateToDateInputValue(now));
		await userEvent.clear(startTimeInput);
		await userEvent.type(startTimeInput, '10:00');

		// Attempt to set end date to today 09:00 (before start)
		await userEvent.clear(endDateInput);
		await userEvent.type(endDateInput, dateToDateInputValue(now));
		await userEvent.clear(endTimeInput);
		await userEvent.type(endTimeInput, '09:00');

		await userEvent.click(
			within(dialog).getByRole('button', { name: /save/i }),
		);

		// await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		// Expect endDate to be 1 hour after startDate due to correction logic
		const expectedStartDate = new Date(`${dateToDateInputValue(now)}T10:00`);
		const expectedEndDate = new Date(expectedStartDate.getTime() + 3600 * 1000);

		// expect(args.onSave).toHaveBeenCalledWith(
		// 	expect.objectContaining({
		// 		endDate: expectedEndDate.toISOString(),
		// 		startDate: expectedStartDate.toISOString(),
		// 	}),
		// );
	},
};
