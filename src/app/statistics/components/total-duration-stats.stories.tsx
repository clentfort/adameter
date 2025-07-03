import type { Meta, StoryObj } from '@storybook/react';
import { FeedingSession } from '@/types/feeding';
import TotalDurationStats from './total-duration-stats';

const createSession = (id: string, durationMinutes: number): FeedingSession => {
	const startTime = new Date();
	const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
	return {
		breast: 'left',
		durationInSeconds: durationMinutes * 60,
		endTime: endTime.toISOString(),
		id,
		startTime: startTime.toISOString(),
	};
};

const sampleSessions: FeedingSession[] = [
	createSession('s1', 15),
	createSession('s2', 20),
	createSession('s3', 12),
	createSession('s4', 18),
];

const meta: Meta<typeof TotalDurationStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: TotalDurationStats,
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
	title: 'App/Statistics/TotalDurationStats',
};

export default meta;
type Story = StoryObj<typeof TotalDurationStats>;

export const DefaultView: Story = {
	args: {
		sessions: sampleSessions,
	},
};

export const NoSessions: Story = {
	args: {
		sessions: [],
	},
};

export const SingleSession: Story = {
	args: {
		sessions: [createSession('s1', 25)],
	},
};

export const LongDurations: Story = {
	args: {
		sessions: [
			createSession('s1', 60),
			createSession('s2', 75),
			createSession('s3', 90),
		],
	},
};
