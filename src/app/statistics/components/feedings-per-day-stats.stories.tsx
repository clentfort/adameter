import type { Meta, StoryObj } from '@storybook/react';
import { FeedingSession } from '@/types/feeding';
import FeedingsPerDayStats from './feedings-per-day-stats';

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
	createSession('s2', createTimestamp(0, 12)),
	createSession('s3', createTimestamp(0, 16)),
	createSession('s4', createTimestamp(1, 9)),
	createSession('s5', createTimestamp(1, 13)),
	createSession('s6', createTimestamp(2, 10)),
	createSession('s7', createTimestamp(2, 14)),
	createSession('s8', createTimestamp(2, 18)),
	createSession('s9', createTimestamp(2, 22)),
];

const meta: Meta<typeof FeedingsPerDayStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: FeedingsPerDayStats,
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
	title: 'App/Statistics/FeedingsPerDayStats',
};

export default meta;
type Story = StoryObj<typeof FeedingsPerDayStats>;

export const DefaultView: Story = {
	args: {
		sessions: sampleSessions,
	},
};

export const DifferentDistribution: Story = {
	args: {
		sessions: [
			createSession('d1s1', createTimestamp(0, 10)),
			createSession('d2s1', createTimestamp(1, 8)),
			createSession('d2s2', createTimestamp(1, 12)),
			createSession('d2s3', createTimestamp(1, 16)),
			createSession('d3s1', createTimestamp(2, 11)),
			createSession('d3s2', createTimestamp(2, 15)),
		],
	},
};

export const SingleDayManyFeedings: Story = {
	args: {
		sessions: [
			createSession('s1', createTimestamp(0, 8)),
			createSession('s2', createTimestamp(0, 10)),
			createSession('s3', createTimestamp(0, 12)),
			createSession('s4', createTimestamp(0, 14)),
			createSession('s5', createTimestamp(0, 16)),
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
