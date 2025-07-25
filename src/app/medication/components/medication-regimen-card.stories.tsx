import type { Meta, StoryObj } from '@storybook/react';
import {
	MedicationRegimen,
	MedicationSchedule,
} from '@/types/medication-regimen';
import { MedicationRegimenCard } from './medication-regimen-card';

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

const createRegimen = (
	id: string,
	name: string,
	schedule: MedicationSchedule,
	partialData: Partial<MedicationRegimen> = {},
): MedicationRegimen => ({
	dosageAmount: 1,
	dosageUnit: 'unit(s)',
	id,
	name,
	prescriber: 'Doctor',
	schedule,
	startDate: yesterday.toISOString(),
	...partialData,
});

const dailySchedule: MedicationSchedule = {
	times: ['09:00', '21:00'],
	type: 'daily',
};
const intervalSchedule: MedicationSchedule = {
	firstDoseTime: '07:00',
	intervalUnit: 'hours',
	intervalValue: 8,
	type: 'interval',
};
const weeklySchedule: MedicationSchedule = {
	daysOfWeek: ['Monday', 'Friday'],
	times: ['12:00'],
	type: 'weekly',
};
const asNeededSchedule: MedicationSchedule = {
	details: 'For high fever over 38.5°C',
	type: 'asNeeded',
};

const sampleRegimens: MedicationRegimen[] = [
	createRegimen('reg1', 'Daily Vitamin X', dailySchedule, {
		notes: 'Take with food.',
		prescriberName: 'Dr. Smith',
	}),
	createRegimen('reg2', '8-hourly Antibiotic Y', intervalSchedule, {
		endDate: nextWeek.toISOString(),
	}),
	createRegimen('reg3', 'Weekly Supplement Z', weeklySchedule),
	createRegimen('reg4', 'Pain Relief PRN', asNeededSchedule, {
		dosageAmount: 500,
		dosageUnit: 'mg',
	}),
	createRegimen('reg5', 'Past Daily Med', dailySchedule, {
		endDate: new Date(2023, 1, 1).toISOString(),
		isDiscontinued: false,
		startDate: new Date(2023, 0, 1).toISOString(),
	}),
	createRegimen('reg6', 'Past Discontinued Med', intervalSchedule, {
		endDate: new Date(2023, 3, 1).toISOString(),
		isDiscontinued: true,
		startDate: new Date(2023, 2, 1).toISOString(),
	}),
];

const meta: Meta<typeof MedicationRegimenCard> = {
	argTypes: {
		isExpanded: { control: 'boolean' },
		isPast: { control: 'boolean' },
		nextDueText: { control: 'text' },
		onDeleteRegimen: { action: 'deleted' },
		onEditRegimen: { action: 'edited' },
		onToggleExpansion: { action: 'toggledExpansion' },
		regimen: { control: 'object' },
	},
	component: MedicationRegimenCard,
	decorators: [
		(Story) => (
			<div style={{ margin: 'auto', maxWidth: '600px' }}>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Medication/MedicationRegimenCard',
};

export default meta;
type Story = StoryObj<typeof MedicationRegimenCard>;

export const ActiveDailyCollapsed: Story = {
	args: {
		isExpanded: false,
		isPast: false,
		nextDueText: 'Today at 9:00 PM',
		onDeleteRegimen: () => {},
		onEditRegimen: () => {},
		onToggleExpansion: () => {},
		regimen: sampleRegimens[0],
	},
};

export const ActiveDailyExpanded: Story = {
	args: {
		...ActiveDailyCollapsed.args,
		isExpanded: true,
	},
};

export const ActiveIntervalWithEndDate: Story = {
	args: {
		isExpanded: false,
		isPast: false,
		nextDueText: 'Tomorrow at 3:00 AM',
		onDeleteRegimen: () => {},
		onEditRegimen: () => {},
		onToggleExpansion: () => {},
		regimen: sampleRegimens[1],
	},
};

export const AsNeededExpanded: Story = {
	args: {
		isExpanded: true,
		isPast: false,
		nextDueText: 'As needed',
		onDeleteRegimen: () => {},
		onEditRegimen: () => {},
		onToggleExpansion: () => {},
		regimen: sampleRegimens[3],
	},
};

export const PastRegimenCollapsed: Story = {
	args: {
		isExpanded: false,
		isPast: true,
		onDeleteRegimen: () => {},
		onEditRegimen: () => {},
		onToggleExpansion: () => {},
		regimen: sampleRegimens[4],
	},
};

export const PastDiscontinuedRegimenExpanded: Story = {
	args: {
		isExpanded: true,
		isPast: true,
		onDeleteRegimen: () => {},
		onEditRegimen: () => {},
		onToggleExpansion: () => {},
		regimen: sampleRegimens[5],
	},
};

export const ToggleExpansionButton: Story = {
	args: {
		...ActiveDailyCollapsed.args,
	},
};

export const ClickEditButton: Story = {
	args: { ...ActiveDailyCollapsed.args },
};

export const ClickDeleteButton: Story = {
	args: { ...ActiveDailyCollapsed.args },
};
