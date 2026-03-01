import type { Meta, StoryObj } from '@storybook/react';
import BreastfeedingTracker from './feeding-tracker';

const meta: Meta<typeof BreastfeedingTracker> = {
	argTypes: {
		nextBreast: { control: 'radio', options: ['left', 'right'] },
		onCreateSession: { action: 'sessionCreated' },
		onUpdateSession: { action: 'sessionUpdated' },
		resumableSession: { control: 'object' },
	},
	component: BreastfeedingTracker,
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
	title: 'App/Feeding/BreastfeedingTracker',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InitialScreenNextLeft: Story = {
	args: {
		nextBreast: 'left',
		onCreateSession: () => {},
		onUpdateSession: () => {},
	},
};

export const InitialScreenNextRight: Story = {
	args: {
		nextBreast: 'right',
		onCreateSession: () => {},
		onUpdateSession: () => {},
	},
};

export const WithResumableLeft: Story = {
	args: {
		nextBreast: 'right',
		onCreateSession: () => {},
		onUpdateSession: () => {},
		resumableSession: {
			breast: 'left',
			durationInSeconds: 240,
			endTime: new Date().toISOString(),
			id: 'resumable-left',
			startTime: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
		},
	},
};

export const WithResumableRight: Story = {
	args: {
		nextBreast: 'left',
		onCreateSession: () => {},
		onUpdateSession: () => {},
		resumableSession: {
			breast: 'right',
			durationInSeconds: 360,
			endTime: new Date().toISOString(),
			id: 'resumable-right',
			startTime: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
		},
	},
};
