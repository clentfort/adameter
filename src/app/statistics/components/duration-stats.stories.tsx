import type { Meta, StoryObj } from '@storybook/react';
import { FeedingSession } from '@/types/feeding';
import DurationStats from './duration-stats';

const createSession = (
	id: string,
	breast: 'left' | 'right',
	durationMinutes: number,
): FeedingSession => {
	const startTime = new Date();
	const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
	return {
		breast,
		durationInSeconds: durationMinutes * 60,
		endTime: endTime.toISOString(),
		id,
		startTime: startTime.toISOString(),
	};
};

const sampleSessions: FeedingSession[] = [
	createSession('s1', 'left', 15),
	createSession('s2', 'right', 20),
	createSession('s3', 'left', 12),
	createSession('s4', 'right', 18),
	createSession('s5', 'left', 16),
	createSession('s6', 'right', 22),
];

const meta: Meta<typeof DurationStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: DurationStats,
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
	title: 'App/Statistics/DurationStats',
};

export default meta;
type Story = StoryObj<typeof DurationStats>;

export const DefaultView: Story = {
	args: {
		sessions: sampleSessions,
	},
};

export const OnlyLeftBreastSessions: Story = {
	args: {
		sessions: [
			createSession('s1', 'left', 10),
			createSession('s2', 'left', 15),
			createSession('s3', 'left', 12),
		],
	},
};

export const OnlyRightBreastSessions: Story = {
	args: {
		sessions: [
			createSession('s1', 'right', 20),
			createSession('s2', 'right', 25),
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
		sessions: [createSession('s1', 'left', 13)],
	},
};
