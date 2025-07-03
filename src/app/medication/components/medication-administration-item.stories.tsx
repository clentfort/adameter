import type { Meta, StoryObj } from '@storybook/react';
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
		onDeleteAdministration: () => {},
		onEditAdministration: () => {},
	},
};

export const MissedWithDetails: Story = {
	args: {
		med: sampleAdminMissedWithDetails,
		onDeleteAdministration: () => {},
		onEditAdministration: () => {},
	},
};

export const AdjustedAndLinkedToRegimen: Story = {
	args: {
		med: sampleAdminAdjustedLinkedToRegimen,
		onDeleteAdministration: action('onDeleteAdministration'),
		onEditAdministration: action('onEditAdministration'),
	},
};

export const ClickEditButton: Story = {
	args: {
		...OnTime.args,
	},
};

export const ClickDeleteButton: Story = {
	args: {
		...MissedWithDetails.args,
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
		onDeleteAdministration: action('onDeleteAdministration'),
		onEditAdministration: action('onEditAdministration'),
	},
};
