import type { Meta, StoryObj } from '@storybook/react';
import { MedicationAdministration } from '@/types/medication';
import { MedicationRegimen } from '@/types/medication-regimen';
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
	decorators: [(Story, { args }) => (args.isOpen ? <Story /> : null)],
	parameters: {
		docs: {
			story: {
				height: '100vh',
				inline: false,
			},
		},
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
		onClose: () => {},
		onSubmit: () => {},
		regimens: sampleRegimens,
	},
};

export const AddModeManualEntry: Story = {
	args: {
		...AddMode.args,
	},
};

export const EditMode: Story = {
	args: {
		allAdministrations: samplePastAdministrations,
		initialData: samplePastAdministrations[0],
		isOpen: true,
		onClose: () => {},
		onSubmit: () => {},
		regimens: sampleRegimens,
	},
};

export const ValidationErrors: Story = {
	args: {
		...AddMode.args,
		isOpen: true,
	},
};
