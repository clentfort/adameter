import type { Meta, StoryObj } from '@storybook/react';
// import { expect } from '@storybook/jest'; // Removed
import { fn } from '@storybook/test';
import { userEvent, within } from '@testing-library/react';
import { FbtContext, IntlVariations } from 'fbt';
import {
	MedicationRegimen,
	MedicationSchedule,
} from '@/types/medication-regimen';
import { MedicationRegimenCard } from './medication-regimen-card';

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

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
			<FbtContext.Provider value={fbtContextValue}>
				<div style={{ margin: 'auto', maxWidth: '600px' }}>
					<Story />
				</div>
			</FbtContext.Provider>
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
		onDeleteRegimen: fn(),
		onEditRegimen: fn(),
		onToggleExpansion: fn(),
		regimen: sampleRegimens[0],
	},
};

export const ActiveDailyExpanded: Story = {
	args: {
		...ActiveDailyCollapsed.args,
		isExpanded: true,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText(/take with food./i)).toBeInTheDocument();
		await expect(canvas.getByText(/dr. smith/i)).toBeInTheDocument();
	},
};

export const ActiveIntervalWithEndDate: Story = {
	args: {
		isExpanded: false,
		isPast: false,
		nextDueText: 'Tomorrow at 3:00 AM',
		onDeleteRegimen: fn(),
		onEditRegimen: fn(),
		onToggleExpansion: fn(),
		regimen: sampleRegimens[1],
	},
};

export const AsNeededExpanded: Story = {
	args: {
		isExpanded: true,
		isPast: false,
		nextDueText: 'As needed', // Or could be empty for PRN
		onDeleteRegimen: fn(),
		onEditRegimen: fn(),
		onToggleExpansion: fn(),
		regimen: sampleRegimens[3],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/for high fever over 38.5°c/i),
		).toBeInTheDocument();
	},
};

export const PastRegimenCollapsed: Story = {
	args: {
		isExpanded: false,
		isPast: true,
		regimen: sampleRegimens[4],
		// nextDueText is not applicable for past regimens
		onDeleteRegimen: fn(),
		onEditRegimen: fn(),
		onToggleExpansion: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText(/january 1, 2023/i)).toBeInTheDocument(); // Start Date
		await expect(canvas.getByText(/february 1, 2023/i)).toBeInTheDocument(); // End Date
		await expect(canvas.queryByText(/next due:/i)).not.toBeInTheDocument();
	},
};

export const PastDiscontinuedRegimenExpanded: Story = {
	args: {
		isExpanded: true,
		isPast: true,
		onDeleteRegimen: fn(),
		onEditRegimen: fn(),
		onToggleExpansion: fn(),
		regimen: sampleRegimens[5],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText(/discontinued/i)).toBeInTheDocument();
		await expect(canvas.getByText(/schedule:/i)).toBeInTheDocument(); // Check expanded content
	},
};

export const ToggleExpansionButton: Story = {
	args: {
		...ActiveDailyCollapsed.args,
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const toggleButton = canvas.getByRole('button', { name: /show more/i });
		await userEvent.click(toggleButton);
		await expect(args.onToggleExpansion).toHaveBeenCalledTimes(1);
		// In a real app, this would re-render with isExpanded=true. Storybook controls this via args.
		// To test visual change, you'd need a stateful wrapper or Storybook interactions addon.
	},
};

export const ClickEditButton: Story = {
	args: { ...ActiveDailyCollapsed.args },
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const editButton = canvas.getAllByRole('button', { name: /edit/i })[0]; // Card might have multiple "Edit" if details are also editable
		await userEvent.click(editButton);
		await expect(args.onEditRegimen).toHaveBeenCalledWith(args.regimen.id);
	},
};

export const ClickDeleteButton: Story = {
	args: { ...ActiveDailyCollapsed.args },
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const deleteButton = canvas.getAllByRole('button', { name: /delete/i })[0];
		await userEvent.click(deleteButton);
		await expect(args.onDeleteRegimen).toHaveBeenCalledWith(args.regimen.id);
	},
};
