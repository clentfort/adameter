import type { Meta, StoryObj } from '@storybook/react';
// import { expect } from '@storybook/jest'; // Removed
import { fn } from '@storybook/test';
import { userEvent, waitFor, within } from '@testing-library/react'; // Corrected
import { FbtContext, IntlVariations } from 'fbt';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import MeasurementForm from './growth-form'; // Assuming default export

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const meta: Meta<typeof MeasurementForm> = {
	argTypes: {
		onClose: { action: 'closed' },
		onSave: { action: 'saved' },
		title: { control: 'text' },
		// 'measurement' prop for EditMode is complex, handled by specific stories
	},
	component: MeasurementForm,
	decorators: [
		(Story) => (
			<FbtContext.Provider value={fbtContextValue}>
				<Story />
			</FbtContext.Provider>
		),
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Growth/MeasurementForm',
};

export default meta;
type Story = StoryObj<typeof MeasurementForm>;

export const AddMode: Story = {
	args: {
		onClose: fn(),
		onSave: fn(),
		title: 'Add New Growth Measurement',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		await expect(dialog).toBeVisible();
		await expect(
			within(dialog).getByText('Add New Growth Measurement'),
		).toBeInTheDocument();

		const dateInput = within(dialog).getByLabelText(/^date$/i);
		await userEvent.clear(dateInput);
		await userEvent.type(dateInput, dateToDateInputValue(now));

		const weightInput = within(dialog).getByLabelText(/weight \(g\)/i);
		await userEvent.type(weightInput, '3500');

		const heightInput = within(dialog).getByLabelText(/height \(cm\)/i);
		await userEvent.type(heightInput, '50.5');

		const headInput = within(dialog).getByLabelText(
			/head circumference \(cm\)/i,
		);
		await userEvent.type(headInput, '34.2');

		const notesInput = within(dialog).getByLabelText(/notes/i);
		await userEvent.type(notesInput, 'Regular checkup, all good.');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		expect(args.onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				date: expect.stringContaining(dateToDateInputValue(now)),
				headCircumference: 34.2,
				height: 50.5,
				notes: 'Regular checkup, all good.',
				weight: 3500,
			}),
		);
	},
};

export const AddModeOnlyWeight: Story = {
	args: {
		...AddMode.args,
		title: 'Add Weight Measurement',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		await userEvent.type(
			within(dialog).getByLabelText(/weight \(g\)/i),
			'3200',
		);

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		expect(args.onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				headCircumference: undefined,
				height: undefined,
				weight: 3200,
			}),
		);
	},
};

export const EditMode: Story = {
	args: {
		measurement: {
			date: yesterday.toISOString(),
			headCircumference: 33.5,
			height: 49.0,
			id: 'growth-123',
			notes: 'Initial measurement',
			weight: 3100,
		},
		onClose: fn(),
		onSave: fn(),
		title: 'Edit Growth Measurement',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		await expect(within(dialog).getByLabelText(/weight \(g\)/i)).toHaveValue(
			3100,
		);
		await expect(within(dialog).getByLabelText(/height \(cm\)/i)).toHaveValue(
			49.0,
		);
		await expect(
			within(dialog).getByLabelText(/head circumference \(cm\)/i),
		).toHaveValue(33.5);
		await expect(within(dialog).getByLabelText(/notes/i)).toHaveValue(
			'Initial measurement',
		);

		// Update values
		const weightInput = within(dialog).getByLabelText(/weight \(g\)/i);
		await userEvent.clear(weightInput);
		await userEvent.type(weightInput, '3150');

		const notesInput = within(dialog).getByLabelText(/notes/i);
		await userEvent.clear(notesInput);
		await userEvent.type(notesInput, 'Follow-up measurement, slight increase.');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		expect(args.onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				height: 49.0, // Unchanged
				id: 'growth-123',
				notes: 'Follow-up measurement, slight increase.',
				weight: 3150,
			}),
		);
	},
};

export const ValidationNoMeasurementEntered: Story = {
	args: {
		...AddMode.args,
		title: 'Test Validation',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');
		// Clear any default/pre-filled values if necessary, though inputs should be empty for AddMode

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		// Check for error message
		const errorMessage = await within(dialog).findByText(
			/please enter at least a weight, height, or head circumference./i,
		);
		await expect(errorMessage).toBeVisible();
		expect(args.onSave).not.toHaveBeenCalled();
	},
};

export const ValidationPartialEntryThenSave: Story = {
	args: {
		...AddMode.args,
		title: 'Test Partial Save',
	},
	play: async ({ args, canvasElement }) => {
		const dialog = within(document.body).getByRole('dialog');

		// Enter only height
		const heightInput = within(dialog).getByLabelText(/height \(cm\)/i);
		await userEvent.type(heightInput, '51.2');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		// Error message should not appear
		await waitFor(() => {
			expect(
				within(dialog).queryByText(
					/please enter at least a weight, height, or head circumference./i,
				),
			).not.toBeInTheDocument();
		});

		await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(1));
		expect(args.onSave).toHaveBeenCalledWith(
			expect.objectContaining({
				headCircumference: undefined,
				height: 51.2,
				weight: undefined,
			}),
		);
	},
};
