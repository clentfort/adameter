import type { Meta, StoryObj } from '@storybook/react';
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
		docs: {
			story: {
				height: '100vh',
				inline: false,
			},
		},
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
};

export const AddModePeriodEvent: Story = {
	args: {
		onClose: () => {},
		onSave: () => {},
		title: 'Add New Period Event',
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
};

export const PeriodEventEndDateBeforeStartDateCorrection: Story = {
	args: {
		onClose: () => {},
		onSave: () => {},
		title: 'Test End Date Correction',
	},
};
