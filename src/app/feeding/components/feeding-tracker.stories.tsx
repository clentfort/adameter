import type { Meta, StoryObj } from '@storybook/react';
import BreastfeedingTracker from './feeding-tracker';

// Mocking useFeedingInProgress for Storybook
let mockFeedingInProgressState: {
	breast: 'left' | 'right';
	startTime: string;
} | null = null;
const mockSetFeedingInProgress = (newState: typeof mockFeedingInProgressState) => {
	mockFeedingInProgressState = newState;
};

const meta: Meta<typeof BreastfeedingTracker> = {
	argTypes: {
		nextBreast: { control: 'radio', options: ['left', 'right'] },
		onCreateSession: { action: 'created' },
		onUpdateSession: { action: 'updated' },
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
type Story = StoryObj<
	typeof BreastfeedingTracker & {
		initialFeedingState?: {
			breast: 'left' | 'right';
			startTime: string;
		} | null;
	}
>;

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

export const StartLeftFeeding: Story = {
	args: {
		nextBreast: 'left',
		onCreateSession: () => {},
		onUpdateSession: () => {},
	},
};

export const FeedingInProgressView: Story = {
	args: {
		nextBreast: 'right',
		onCreateSession: () => {},
		onUpdateSession: () => {},
		// @ts-ignore: Forcing initial state via args for story setup
		initialFeedingState: {
			breast: 'right',
			startTime: new Date().toISOString(),
		},
	},
};

export const EndFeedingAction: Story = {
	args: {
		...FeedingInProgressView.args,
		// @ts-ignore: Forcing initial state
		initialFeedingState: {
			breast: 'left',
			startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		},
	},
};

export const EnterTimeManuallyDialog: Story = {
	args: {
		...FeedingInProgressView.args,
		// @ts-ignore: Forcing initial state
		initialFeedingState: {
			breast: 'right',
			startTime: new Date().toISOString(),
		},
	},
};

export const SaveManualTimeEntry: Story = {
	args: {
		...FeedingInProgressView.args,
		// @ts-ignore: Forcing initial state
		initialFeedingState: {
			breast: 'left',
			startTime: new Date().toISOString(),
		},
	},
};
