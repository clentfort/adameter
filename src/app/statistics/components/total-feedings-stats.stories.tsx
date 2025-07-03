import type { Meta, StoryObj } from '@storybook/react';
import { FeedingSession } from '@/types/feeding';
import TotalFeedingsStats from './total-feedings-stats';

const createSession = (
	id: string,
	breast: 'left' | 'right',
): FeedingSession => {
	const startTime = new Date();
	return {
		breast,
		durationInSeconds: 15 * 60,
		endTime: new Date(startTime.getTime() + 15 * 60 * 1000).toISOString(),
		id,
		startTime: startTime.toISOString(),
	};
};

const sampleSessions: FeedingSession[] = [
	createSession('s1', 'left'),
	createSession('s2', 'right'),
	createSession('s3', 'left'),
	createSession('s4', 'left'),
];

const meta: Meta<typeof TotalFeedingsStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: TotalFeedingsStats,
	decorators: [
		(Story) => (
			<div style={{ width: '300px' }}>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Statistics/TotalFeedingsStats',
};

export default meta;
type Story = StoryObj<typeof TotalFeedingsStats>;

export const DefaultView: Story = {
	args: {
		sessions: sampleSessions,
	},
};

export const OnlyLeftBreast: Story = {
	args: {
		sessions: [createSession('s1', 'left'), createSession('s2', 'left')],
	},
};

export const OnlyRightBreast: Story = {
	args: {
		sessions: [
			createSession('s1', 'right'),
			createSession('s2', 'right'),
			createSession('s3', 'right'),
		],
	},
};

export const NoSessions: Story = {
	args: {
		sessions: [],
	},
};

export const SingleSession: Story = {
	args: {
		sessions: [createSession('s1', 'right')],
	},
};
