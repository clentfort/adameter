import type { Meta, StoryObj } from '@storybook/react';
import type { FeedingSession } from '@/types/feeding';
import BreastfeedingTracker from './feeding-tracker';
import React from 'react';
import {
	// useFeedingInProgress, // Not used directly in this file, but its type is
	type UseFeedingInProgressType,
} from '@/hooks/use-feeing-in-progress';

const meta: Meta<typeof BreastfeedingTracker> = {
	argTypes: {
		latestFeedingSession: { control: 'object' },
		nextBreast: { control: 'radio', options: ['left', 'right'] },
		onSessionComplete: { action: 'sessionCompleted' },
		// _useFeedingInProgressOverride is handled by the decorator, not a direct story arg
	},
	component: BreastfeedingTracker,
	decorators: [
		(Story, { args }) => {
			const { initialFeedingState: currentInitialStateFromArgs, ...storyComponentArgs } =
				args as typeof args & {
					initialFeedingState?: { breast: 'left' | 'right'; startTime: string } | null;
				};

			// Ensure ref is initialized with null if undefined, to match FeedingInProgress | null
			const mockStateRef = React.useRef(
				currentInitialStateFromArgs === undefined ? null : currentInitialStateFromArgs
			);

			React.useEffect(() => {
				mockStateRef.current = currentInitialStateFromArgs === undefined ? null : currentInitialStateFromArgs;
			}, [currentInitialStateFromArgs]);

			const mockUseFeedingInProgress: UseFeedingInProgressType = () => {
				// eslint-disable-next-line react-hooks/rules-of-hooks
				const [state, setStateHook] = React.useState(mockStateRef.current);

				React.useEffect(() => {
					setStateHook(mockStateRef.current);
				}, [mockStateRef.current]);

				const setFeedingState = (
					newVal: { breast: 'left' | 'right'; startTime: string } | null,
				) => {
					mockStateRef.current = newVal;
					setStateHook(newVal);
				};
				return [state, setFeedingState] as const;
			};

			return (
				<Story
					{...storyComponentArgs}
					_useFeedingInProgressOverride={mockUseFeedingInProgress}
				/>
			);
		},
	],
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

const generateRecentSession = (
	breast: 'left' | 'right',
	minutesAgo: number,
): FeedingSession => {
	const now = new Date();
	const startTime = new Date(now.getTime() - (minutesAgo + 5) * 60 * 1000);
	const endTime = new Date(now.getTime() - minutesAgo * 60 * 1000);
	return {
		breast,
		durationInSeconds: 5 * 60,
		endTime: endTime.toISOString(),
		id: `session-${breast}-${minutesAgo}`,
		startTime: startTime.toISOString(),
	};
};

type Story = StoryObj<
	Omit<React.ComponentProps<typeof BreastfeedingTracker>, '_useFeedingInProgressOverride'> & {
		initialFeedingState?: {
			breast: 'left' | 'right';
			startTime: string;
		} | null; // Acknowledging null is a valid state for initialFeedingState
	}
>;

export const DefaultNoRecentSessionNextLeft: Story = {
	args: {
		initialFeedingState: null,
		latestFeedingSession: undefined,
		nextBreast: 'left',
		onSessionComplete: () => {},
	},
	name: 'Initial: No Recent Session, Next Left',
};

export const DefaultNoRecentSessionNextRight: Story = {
	args: {
		initialFeedingState: null,
		latestFeedingSession: undefined,
		nextBreast: 'right',
		onSessionComplete: () => {},
	},
	name: 'Initial: No Recent Session, Next Right',
};

export const ResumeLeftAvailable: Story = {
	args: {
		initialFeedingState: null,
		latestFeedingSession: generateRecentSession('left', 2),
		nextBreast: 'right',
		onSessionComplete: () => {},
	},
	name: 'Resume: Left Breast (Recent Session < 5min ago)',
};

export const ResumeRightAvailable: Story = {
	args: {
		initialFeedingState: null,
		latestFeedingSession: generateRecentSession('right', 3),
		nextBreast: 'left',
		onSessionComplete: () => {},
	},
	name: 'Resume: Right Breast (Recent Session < 5min ago)',
};

export const ResumeLeftExpiredNextRight: Story = {
	args: {
		initialFeedingState: null,
		latestFeedingSession: generateRecentSession('left', 10),
		nextBreast: 'right',
		onSessionComplete: () => {},
	},
	name: 'Resume Expired: Next Right (Left Session > 5min ago)',
};

export const ResumeRightExpiredNextLeft: Story = {
	args: {
		initialFeedingState: null,
		latestFeedingSession: generateRecentSession('right', 7),
		nextBreast: 'left',
		onSessionComplete: () => {},
	},
	name: 'Resume Expired: Next Left (Right Session > 5min ago)',
};

export const FeedingInProgressFromNewStartLeft: Story = {
	args: {
		initialFeedingState: {
			breast: 'left',
			startTime: new Date().toISOString(),
		},
		latestFeedingSession: undefined,
		nextBreast: 'right',
		onSessionComplete: () => {},
	},
	name: 'Active: Feeding In Progress (Started New Left)',
};

export const FeedingInProgressFromResumedRight: Story = {
	args: {
		nextBreast: 'left',
		initialFeedingState: {
			breast: 'right',
			startTime: generateRecentSession('right', 2).startTime,
		},
		latestFeedingSession: generateRecentSession('right', 2),
		onSessionComplete: () => {},
	},
	name: 'Active: Feeding In Progress (Resumed Right)',
	parameters: {
		docs: {
			description: {
				story:
					'This story simulates the state *after* a user has clicked "Resume" on a recent right breast session. The timer continues from the original start time of that resumed session.',
			},
		},
	},
};

export const OriginalInitialScreenNextLeft: Story = {
	args: {
		initialFeedingState: null,
		nextBreast: 'left',
		onSessionComplete: () => {},
	},
	name: 'Legacy: Initial Screen, Next Left',
};

export const OriginalInitialScreenNextRight: Story = {
	args: {
		initialFeedingState: null,
		nextBreast: 'right',
		onSessionComplete: () => {},
	},
	name: 'Legacy: Initial Screen, Next Right',
};

export const OriginalFeedingInProgressView: Story = {
	args: {
		initialFeedingState: {
			breast: 'right',
			startTime: new Date().toISOString(),
		},
		nextBreast: 'right',
		onSessionComplete: () => {},
	},
	name: 'Legacy: Feeding In Progress View (Right)',
};

export const EndFeedingAction: Story = {
	args: {
		initialFeedingState: {
			breast: 'left',
			startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		},
		nextBreast: 'left',
		onSessionComplete: () => {},
	},
	name: 'Action: End Feeding (During Active Session)',
};

export const EnterTimeManuallyDialog: Story = {
	args: {
		initialFeedingState: {
			breast: 'right',
			startTime: new Date().toISOString(),
		},
		nextBreast: 'right',
		onSessionComplete: () => {},
	},
	name: 'Dialog: Enter Time Manually (During Active Session)',
};
