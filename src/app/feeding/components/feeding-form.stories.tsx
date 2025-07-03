import type { Meta, StoryObj } from '@storybook/react';
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
		docs: {
			story: {
				height: '100vh',
				inline: false,
			},
		},
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Feeding/FeedingForm',
};

export default meta;
type Story = StoryObj<typeof FeedingForm>;

export const AddModeDefaultLeft: Story = {
	args: {
		onClose: () => {},
		onSave: () => {},
		title: 'Log New Feeding Session',
	},
};

export const AddModeSelectRightBreast: Story = {
	args: {
		...AddModeDefaultLeft.args,
		title: 'Log Right Breast Feeding',
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
		onClose: () => {},
		onSave: () => {},
		title: 'Edit Feeding Session',
	},
};

export const InvalidDurationInput: Story = {
	args: {
		...AddModeDefaultLeft.args,
		title: 'Test Invalid Duration',
	},
};
