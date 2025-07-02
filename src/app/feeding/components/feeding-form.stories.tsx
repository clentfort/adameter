import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@testing-library/react';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import FeedingForm from './feeding-form';

const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const meta: Meta<typeof FeedingForm> = {
	argTypes: {
		feeding: { control: 'object' }, // For edit mode
		onClose: { action: 'closed' },
		onSave: { action: 'saved' },
		title: { control: 'text' },
	},
	component: FeedingForm,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Feeding/FeedingForm',
};

export default meta;
type Story = StoryObj<typeof FeedingForm>;

export const AddModeDefaultLeft: Story = {
	args: {
		onClose: vi.fn(),
		onSave: vi.fn(),
		title: 'Log New Feeding Session',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		await expect(dialog).toBeVisible();
		await expect(
			within(dialog).getByText('Log New Feeding Session'),
		).toBeInTheDocument();

		const leftBreastRadio = within(dialog).getByLabelText(/left breast/i);
		await expect(leftBreastRadio).toBeChecked();

		const dateInput = within(dialog).getByLabelText(/^date$/i);
		await userEvent.clear(dateInput);
		await userEvent.type(dateInput, dateToDateInputValue(now));

		const timeInput = within(dialog).getByLabelText(/start time/i);
		await userEvent.clear(timeInput);
		await userEvent.type(timeInput, dateToTimeInputValue(now));

		const durationInput = within(dialog).getByLabelText(/minutes/i);
		await userEvent.clear(durationInput);
		await userEvent.type(durationInput, '15');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		expect(args.onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				breast: 'left',
				durationInSeconds: 15 * 60,
				endTime: expect.any(String),
				startTime: expect.stringContaining(dateToDateInputValue(now)),
			}),
		);
	},
};

export const AddModeSelectRightBreast: Story = {
	args: {
		...AddModeDefaultLeft.args,
		title: 'Log Right Breast Feeding',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		const rightBreastRadio = within(dialog).getByLabelText(/right breast/i);
		await userEvent.click(rightBreastRadio);
		await expect(rightBreastRadio).toBeChecked();

		await userEvent.type(within(dialog).getByLabelText(/minutes/i), '20');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		expect(args.onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				breast: 'right',
				durationInSeconds: 20 * 60,
			}),
		);
	},
};

export const EditMode: Story = {
	args: {
		feeding: {
			breast: 'right',
			durationInSeconds: 12 * 60, // 12 minutes
			endTime: new Date(
				new Date(yesterday).getTime() + 12 * 60 * 1000,
			).toISOString(),
			id: 'feeding-123',
			startTime: yesterday.toISOString(),
		},
		onClose: vi.fn(),
		onSave: vi.fn(),
		title: 'Edit Feeding Session',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		await expect(
			within(dialog).getByText('Edit Feeding Session'),
		).toBeInTheDocument();

		await expect(within(dialog).getByLabelText(/right breast/i)).toBeChecked();
		await expect(within(dialog).getByLabelText(/^date$/i)).toHaveValue(
			dateToDateInputValue(new Date(args.feeding!.startTime)),
		);
		await expect(within(dialog).getByLabelText(/start time/i)).toHaveValue(
			dateToTimeInputValue(new Date(args.feeding!.startTime)),
		);
		await expect(within(dialog).getByLabelText(/minutes/i)).toHaveValue('12');

		const durationInput = within(dialog).getByLabelText(/minutes/i);
		await userEvent.clear(durationInput);
		await userEvent.type(durationInput, '18');

		await userEvent.click(within(dialog).getByLabelText(/left breast/i));

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		expect(args.onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				breast: 'left',
				durationInSeconds: 18 * 60,
				id: 'feeding-123',
			}),
		);
	},
};

export const InvalidDurationInput: Story = {
	args: {
		...AddModeDefaultLeft.args,
		title: 'Test Invalid Duration',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		const durationInput = within(dialog).getByLabelText(/minutes/i);
		await userEvent.clear(durationInput);
		await userEvent.type(durationInput, 'abc');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await new Promise((resolve) => setTimeout(resolve, 100));
		expect(args.onSave).not.toHaveBeenCalled();
	},
};
