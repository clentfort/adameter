import type { Meta, StoryObj } from '@storybook/react';
import { FeedingSession } from '@/types/feeding';
import TimeBetweenStats from './time-between-stats';

const today = new Date();
const createTimestamp = (
	daysAgo: number,
	hour: number,
	minute: number = 0,
): string => {
	const d = new Date(today);
	d.setDate(today.getDate() - daysAgo);
	d.setHours(hour, minute, 0, 0);
	return d.toISOString();
};

const createSession = (id: string, startTime: string): FeedingSession => ({
	breast: 'left',
	durationInSeconds: 15 * 60,
	endTime: new Date(
		new Date(startTime).getTime() + 15 * 60 * 1000,
	).toISOString(),
	id,
	startTime,
});

const sampleSessions: FeedingSession[] = [
	createSession('s1', createTimestamp(0, 8)),
	createSession('s2', createTimestamp(0, 11)),
	createSession('s3', createTimestamp(0, 13, 30)),
	createSession('s4', createTimestamp(0, 16)),
	createSession('s5', createTimestamp(1, 7)),
];

const meta: Meta<typeof TimeBetweenStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: TimeBetweenStats,
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
	title: 'App/Statistics/TimeBetweenStats',
};

export default meta;
type Story = StoryObj<typeof TimeBetweenStats>;

export const DefaultView: Story = {
	args: {
		sessions: sampleSessions,
	},
};

export const RegularIntervals: Story = {
	args: {
		sessions: [
			createSession('r1', createTimestamp(0, 6)),
			createSession('r2', createTimestamp(0, 9)),
			createSession('r3', createTimestamp(0, 12)),
			createSession('r4', createTimestamp(0, 15)),
		],
	},
};

export const NoSessions: Story = {
	args: {
		sessions: [],
	},
};

export const OneSession: Story = {
	args: {
		sessions: [createSession('s1', createTimestamp(0, 12))],
	},
};

export const TwoSessionsCloseTogether: Story = {
	args: {
		sessions: [
			createSession('s1', createTimestamp(0, 12, 0)),
			createSession('s2', createTimestamp(0, 12, 30)),
		],
	},
};

export const SessionsWithZeroTimeBetween: Story = {
	args: {
		sessions: [
			createSession('s1', createTimestamp(0, 12, 0)),
			createSession('s2', createTimestamp(0, 12, 0)),
			createSession('s3', createTimestamp(0, 15, 0)),
		],
	},
};
