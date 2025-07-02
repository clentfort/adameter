import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { userEvent, waitFor, within } from '@testing-library/react';
import { MedicationAdministration } from '@/types/medication';
import { MedicationRegimen } from '@/types/medication-regimen';
import {
	dateToDateInputValue,
	dateToTimeInputValue,
} from '@/utils/date-to-date-input-value';
import { MedicationAdministrationForm } from './medication-administration-form';

const now = new Date();
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);

const sampleRegimens: MedicationRegimen[] = [
	{
		dayOfWeek: 0,
		dosageAmount: 1,
		dosageUnit: 'drop',
		id: 'reg1',
		intervalDays: 0,
		name: 'Vitamin D Drops',
		scheduleType: 'daily',
		specificTimes: ['08:00'],
		timesPerDay: 1,
	},
	{
		dosageAmount: 5,
		dosageUnit: 'ml',
		id: 'reg2',
		name: 'Pain Reliever X',
		scheduleType: 'asNeeded',
	},
];

const samplePastAdministrations: MedicationAdministration[] = [
	{
		administrationStatus: 'On Time',
		dosageAmount: 1,
		dosageUnit: 'drop',
		id: 'adm0',
		medicationName: 'Vitamin D Drops',
		regimenId: 'reg1',
		timestamp: yesterday.toISOString(),
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 2.5,
		dosageUnit: 'ml',
		id: 'adm1',
		medicationName: 'Ibuprofen Syrup',
		timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
	},
	{
		administrationStatus: 'Adjusted',
		dosageAmount: 5,
		dosageUnit: 'ml',
		id: 'adm2',
		medicationName: 'Amoxicillin',
		timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
	},
];

const meta: Meta<typeof MedicationAdministrationForm> = {
	argTypes: {
		allAdministrations: { control: 'object' },
		initialData: { control: 'object' },
		isOpen: { control: 'boolean' },
		onClose: { action: 'closed' },
		onSubmit: { action: 'submitted' },
		regimens: { control: 'object' },
	},
	component: MedicationAdministrationForm,
	decorators: [
		(Story, { args }) => (
			args.isOpen ? <Story /> : null
		),
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Medication/MedicationAdministrationForm',
};

export default meta;
type Story = StoryObj<typeof MedicationAdministrationForm>;

export const AddMode: Story = {
	args: {
		allAdministrations: samplePastAdministrations,
		initialData: undefined,
		isOpen: true,
		onClose: fn(),
		onSubmit: fn(),
		regimens: sampleRegimens,
	},
	play: async ({ args, canvasElement }) => {
		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		await expect(
			within(dialog).getByText('Add Medication Entry'),
		).toBeInTheDocument();

		const comboboxTrigger = within(dialog).getByRole('combobox', {
			name: /medication name/i,
		});
		await userEvent.click(comboboxTrigger);

		const popoverContent = await waitFor(() =>
			within(document.body).getByRole('listbox'),
		);
		await userEvent.click(within(popoverContent).getByText('Vitamin D Drops'));
		await expect(comboboxTrigger).toHaveTextContent('Vitamin D Drops');
		await expect(within(dialog).getByLabelText(/dosage amount/i)).toHaveValue(
			1,
		);
		await expect(within(dialog).getByLabelText(/unit/i)).toHaveValue('drop');

		const dateInput = within(dialog).getByLabelText(/^date$/i);
		await userEvent.clear(dateInput);
		await userEvent.type(dateInput, dateToDateInputValue(now));
		const timeInput = within(dialog).getByLabelText(/^time$/i);
		await userEvent.clear(timeInput);
		await userEvent.type(timeInput, dateToTimeInputValue(now));

		await userEvent.click(
			within(dialog).getByRole('button', { name: 'Save Entry' }),
		);

		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
		expect(args.onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				administrationStatus: 'On Time',
				dosageAmount: 1,
				dosageUnit: 'drop',
				medicationName: 'Vitamin D Drops',
				regimenId: 'reg1',
			}),
			undefined,
		);
	},
};

export const AddModeManualEntry: Story = {
	args: {
		...AddMode.args,
	},
	play: async ({ args, canvasElement }) => {
		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		const comboboxTrigger = within(dialog).getByRole('combobox', {
			name: /medication name/i,
		});
		await userEvent.click(comboboxTrigger);

		const popoverContent = await waitFor(() =>
			within(document.body).getByRole('listbox'),
		);
		const searchInput =
			within(popoverContent).getByPlaceholderText(/search medication.../i);

		await userEvent.clear(searchInput);
		await userEvent.type(searchInput, 'Ibuprofen Syrup');
		await userEvent.click(within(popoverContent).getByText('Ibuprofen Syrup'));
		await expect(comboboxTrigger).toHaveTextContent('Ibuprofen Syrup');
		await expect(within(dialog).getByLabelText(/dosage amount/i)).toHaveValue(
			2.5,
		);
		await expect(within(dialog).getByLabelText(/unit/i)).toHaveValue('ml');

		const dosageAmountInput = within(dialog).getByLabelText(/dosage amount/i);
		await userEvent.clear(dosageAmountInput);
		await userEvent.type(dosageAmountInput, '10');

		const dosageUnitInput = within(dialog).getByLabelText(/unit/i);
		await userEvent.clear(dosageUnitInput);
		await userEvent.type(dosageUnitInput, 'drops');

		await userEvent.click(
			within(dialog).getByRole('button', { name: 'Save Entry' }),
		);
		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
		expect(args.onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				dosageAmount: 10,
				dosageUnit: 'drops',
				medicationName: 'Ibuprofen Syrup',
				regimenId: undefined,
			}),
			undefined,
		);
	},
};

export const EditMode: Story = {
	args: {
		allAdministrations: samplePastAdministrations,
		initialData: samplePastAdministrations[0],
		isOpen: true,
		onClose: fn(),
		onSubmit: fn(),
		regimens: sampleRegimens,
	},
	play: async ({ args, canvasElement }) => {
		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		await expect(
			within(dialog).getByText('Edit Medication Entry'),
		).toBeInTheDocument();

		await expect(
			within(dialog).getByRole('combobox', { name: /medication name/i }),
		).toHaveTextContent('Vitamin D Drops');
		await expect(within(dialog).getByLabelText(/dosage amount/i)).toHaveValue(
			samplePastAdministrations[0].dosageAmount,
		);
		await expect(within(dialog).getByLabelText(/unit/i)).toHaveValue(
			samplePastAdministrations[0].dosageUnit,
		);

		await userEvent.click(within(dialog).getByLabelText('Adjusted'));

		const detailsInput = within(dialog).getByLabelText(/details\/notes/i);
		await userEvent.type(detailsInput, ' - given a bit late');

		await userEvent.click(
			within(dialog).getByRole('button', { name: 'Save Changes' }),
		);

		await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
		expect(args.onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				administrationStatus: 'Adjusted',
				details: ' - given a bit late',
				medicationName: 'Vitamin D Drops',
			}),
			samplePastAdministrations[0].id,
		);
	},
};

export const ValidationErrors: Story = {
	args: {
		...AddMode.args,
		isOpen: true,
	},
	play: async ({ canvasElement }) => {
		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		await userEvent.click(
			within(dialog).getByRole('button', { name: 'Save Entry' }),
		);

		await expect(
			await within(dialog).findByText('Medication name is required.'),
		).toBeVisible();
	},
};
