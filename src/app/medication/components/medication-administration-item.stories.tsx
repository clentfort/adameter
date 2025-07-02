import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { userEvent, within } from '@testing-library/react';
import { MedicationAdministration } from '@/types/medication';
import { MedicationAdministrationItem } from './medication-administration-item';

const now = new Date();
const anHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

const sampleAdminOnTime: MedicationAdministration = {
	administrationStatus: 'On Time',
	dosageAmount: 500,
	dosageUnit: 'mg',
	id: 'admin1',
	medicationName: 'Paracetamol',
	timestamp: now.toISOString(),
};

const sampleAdminMissedWithDetails: MedicationAdministration = {
	administrationStatus: 'Missed',
	details: 'Forgot to take in the morning',
	dosageAmount: 1000,
	dosageUnit: 'mg',
	id: 'admin2',
	medicationName: 'Vitamin C',
	timestamp: anHourAgo.toISOString(),
};

const sampleAdminAdjustedLinkedToRegimen: MedicationAdministration = {
	administrationStatus: 'Adjusted',
	details: 'Taken 1 hour late with food',
	dosageAmount: 5,
	dosageUnit: 'ml',
	id: 'admin3',
	medicationName: 'Antibiotic X',
	regimenId: 'regimen-abc-123',
	timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
};

const meta: Meta<typeof MedicationAdministrationItem> = {
	argTypes: {
		med: { control: 'object' },
		onDeleteAdministration: { action: 'deleted' },
		onEditAdministration: { action: 'edited' },
	},
	component: MedicationAdministrationItem,
	decorators: [
		(Story) => (
			<div style={{ margin: 'auto', maxWidth: '500px' }}>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Medication/MedicationAdministrationItem',
};

export default meta;
type Story = StoryObj<typeof MedicationAdministrationItem>;

export const OnTime: Story = {
	args: {
		med: sampleAdminOnTime,
		onDeleteAdministration: fn(),
		onEditAdministration: fn(),
	},
};

export const MissedWithDetails: Story = {
	args: {
		med: sampleAdminMissedWithDetails,
		onDeleteAdministration: fn(),
		onEditAdministration: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/forgot to take in the morning/i),
		).toBeInTheDocument();
	},
};

export const AdjustedAndLinkedToRegimen: Story = {
	args: {
		med: sampleAdminAdjustedLinkedToRegimen,
		onDeleteAdministration: fn(),
		onEditAdministration: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/taken 1 hour late with food/i),
		).toBeInTheDocument();
		await expect(
			canvas.getByText(/\(linked to regimen\)/i),
		).toBeInTheDocument();
	},
};

export const ClickEditButton: Story = {
	args: {
		...OnTime.args,
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const editButton = canvas.getByRole('button', { name: /edit/i });
		await userEvent.click(editButton);
		await expect(args.onEditAdministration).toHaveBeenCalledWith(args.med.id);
	},
};

export const ClickDeleteButton: Story = {
	args: {
		...MissedWithDetails.args,
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const deleteButton = canvas.getByRole('button', { name: /delete/i });
		await userEvent.click(deleteButton);
		await expect(args.onDeleteAdministration).toHaveBeenCalledWith(args.med.id);
	},
};

export const LongMedicationNameAndDetails: Story = {
	args: {
		med: {
			administrationStatus: 'Adjusted',
			details:
				'This is a very long and detailed note about the administration of this particular medication, including observations and any deviations from the prescribed regimen or timing. It might wrap to multiple lines.',
			dosageAmount: 12_345.67,
			dosageUnit: 'particles/mol',
			id: 'admin-long',
			medicationName:
				'Supercalifragilisticexpialidocious Compound RX Plus Ultra Mega Strength',
			timestamp: now.toISOString(),
		},
		onDeleteAdministration: fn(),
		onEditAdministration: fn(),
	},
};
