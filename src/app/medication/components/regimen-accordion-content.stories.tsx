import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { userEvent, within } from '@testing-library/react';
import { fbt } from 'fbtee';
import {
	MedicationRegimen,
	MedicationSchedule,
} from '@/types/medication-regimen';
import { RegimenAccordionContent } from './regimen-accordion-content';

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

const activeRegimens: MedicationRegimen[] = [
	createRegimen('active1', 'Morning Vitality', dailySchedule, {
		notes: 'Take with breakfast',
	}),
	createRegimen(
		'active2',
		'Night Calm',
		{ times: ['22:00'], type: 'daily' },
		{ endDate: nextWeek.toISOString() },
	),
];

const pastRegimens: MedicationRegimen[] = [
	createRegimen('past1', 'Old Antibiotic Course', intervalSchedule, {
		endDate: new Date(2023, 0, 7).toISOString(),
		startDate: new Date(2023, 0, 1).toISOString(),
	}),
	createRegimen('past2', 'Discontinued Supplement', dailySchedule, {
		endDate: new Date(2023, 2, 1).toISOString(),
		isDiscontinued: true,
		startDate: new Date(2023, 1, 1).toISOString(),
	}),
];

const noItemsFbtMessage = (
	<fbt desc="No items message for story">No regimens in this section.</fbt>
);

const meta: Meta<typeof RegimenAccordionContent> = {
	argTypes: {
		expandedRegimens: { control: 'object' },
		handleDeleteRegimen: { action: 'deletedRegimen' },
		handleEditRegimen: { action: 'editedRegimen' },
		isPastSection: { control: 'boolean' },
		noItemsMessage: { control: 'object' },
		regimens: { control: 'object' },
		toggleRegimenExpansion: { action: 'toggledExpansion' },
	},
	component: RegimenAccordionContent,
	decorators: [
		(Story) => (
			<div style={{ margin: 'auto', maxWidth: '700px' }}>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Medication/RegimenAccordionContent',
};

export default meta;
type Story = StoryObj<typeof RegimenAccordionContent>;

export const ActiveRegimensSomeExpanded: Story = {
	args: {
		expandedRegimens: { [activeRegimens[0].id]: true },
		handleDeleteRegimen: fn(),
		handleEditRegimen: fn(),
		isPastSection: false,
		noItemsMessage: noItemsFbtMessage,
		regimens: activeRegimens,
		toggleRegimenExpansion: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText(activeRegimens[0].name)).toBeInTheDocument();
		await expect(
			canvas.getByText(activeRegimens[0].notes!),
		).toBeInTheDocument();
		await expect(canvas.getByText(activeRegimens[1].name)).toBeInTheDocument();
	},
};

export const ActiveRegimensNoneExpanded: Story = {
	args: {
		expandedRegimens: {},
		handleDeleteRegimen: fn(),
		handleEditRegimen: fn(),
		isPastSection: false,
		noItemsMessage: noItemsFbtMessage,
		regimens: activeRegimens,
		toggleRegimenExpansion: fn(),
	},
};

export const PastRegimensOneExpanded: Story = {
	args: {
		expandedRegimens: { [pastRegimens[1].id]: true },
		handleDeleteRegimen: fn(),
		handleEditRegimen: fn(),
		isPastSection: true,
		noItemsMessage: noItemsFbtMessage,
		regimens: pastRegimens,
		toggleRegimenExpansion: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText(pastRegimens[1].name)).toBeInTheDocument();
		await expect(canvas.getByText(/discontinued/i)).toBeInTheDocument();
	},
};

export const NoActiveRegimens: Story = {
	args: {
		expandedRegimens: {},
		handleDeleteRegimen: fn(),
		handleEditRegimen: fn(),
		isPastSection: false,
		noItemsMessage: (
			<fbt desc="No active regimens message">
				You have no active medication regimens.
			</fbt>
		),
		regimens: [],
		toggleRegimenExpansion: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/you have no active medication regimens./i),
		).toBeInTheDocument();
	},
};

export const NoPastRegimens: Story = {
	args: {
		expandedRegimens: {},
		handleDeleteRegimen: fn(),
		handleEditRegimen: fn(),
		isPastSection: true,
		noItemsMessage: (
			<fbt desc="No past regimens message">
				No past medication regimens found.
			</fbt>
		),
		regimens: [],
		toggleRegimenExpansion: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/no past medication regimens found./i),
		).toBeInTheDocument();
	},
};

export const InteractionToggleExpansion: Story = {
	args: {
		...ActiveRegimensSomeExpanded.args,
		expandedRegimens: { [activeRegimens[0].id]: false },
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const firstRegimenCard = canvas
			.getByText(activeRegimens[0].name)
			.closest('div.rounded-lg');
		if (!firstRegimenCard)
			throw new Error('Could not find regimen card for interaction test');

		const showMoreButton = within(firstRegimenCard).getByRole('button', {
			name: /show more/i,
		});
		await userEvent.click(showMoreButton);
		await expect(args.toggleRegimenExpansion).toHaveBeenCalledWith(
			activeRegimens[0].id,
		);
	},
};
