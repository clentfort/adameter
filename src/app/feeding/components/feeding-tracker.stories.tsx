import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import BreastfeedingTracker from './feeding-tracker';

const meta: Meta<typeof BreastfeedingTracker> = {
	argTypes: {
		nextBreast: { control: 'radio', options: ['left', 'right'] },
		onCreateSession: { action: 'onCreateSession' },
		onUpdateSession: { action: 'onUpdateSession' },
	},
	component: BreastfeedingTracker,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Feeding/BreastfeedingTracker',
};

export default meta;
type Story = StoryObj<typeof BreastfeedingTracker>;

export const InitialScreenNextLeft: Story = {
	args: {
		nextBreast: 'left',
	},
};

export const InitialScreenNextRight: Story = {
	args: {
		nextBreast: 'right',
	},
};

export const FeedingInProgress: Story = {
	args: {
		nextBreast: 'right',
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByText('Right Breast'));
	},
};

export const EnterTimeManually: Story = {
	args: {
		nextBreast: 'right',
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(canvas.getByText('Right Breast'));
		await userEvent.click(canvas.getByText('Enter Time Manually'));
	},
};