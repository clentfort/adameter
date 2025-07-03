import type { Meta, StoryObj } from '@storybook/react';
import { FeedingSession } from '@/types/feeding';
import HeatMap from './heat-map';

const today = new Date();
const createSession = (
	id: string,
	startHour: number,
	startMinute: number,
	durationMinutes: number,
): FeedingSession => {
	const startTime = new Date(today);
	startTime.setHours(startHour, startMinute, 0, 0);

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
	createSession('s1', 7, 0, 30),
	createSession('s2', 7, 15, 20),
	createSession('s3', 7, 30, 25),
	createSession('s4', 8, 0, 30),
	createSession('s5', 12, 30, 45),
	createSession('s6', 13, 0, 30),
	createSession('s7', 18, 0, 20),
	createSession('s8', 18, 30, 30),
	createSession('s9', 19, 0, 25),
	createSession('s10', 22, 45, 40),
	createSession('s11', 23, 50, 30),
];

const meta: Meta<typeof HeatMap> = {
	argTypes: {
		className: { control: 'text' },
		sessions: { control: 'object' },
	},
	component: HeatMap,
	decorators: [
		(Story) => (
			<div style={{ margin: 'auto', maxWidth: '800px' }}>
				<Story />
			</div>
		),
	],
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Statistics/HeatMap',
};

export default meta;
type Story = StoryObj<typeof HeatMap>;

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

export const SparselyDistributedSessions: Story = {
	args: {
		sessions: [
			createSession('sparse1', 2, 0, 30),
			createSession('sparse2', 14, 0, 30),
			createSession('sparse3', 22, 0, 30),
		],
	},
};

export const ConcentratedActivity: Story = {
	args: {
		sessions: [
			createSession('c1', 8, 45, 20),
			createSession('c2', 8, 50, 30),
			createSession('c3', 9, 0, 25),
			createSession('c4', 9, 5, 30),
			createSession('c5', 9, 10, 20),
			createSession('c6', 9, 15, 20),
		],
	},
};

export const SessionsSpanningMidnightExactly: Story = {
	args: {
		sessions: [createSession('midnight1', 23, 30, 60)],
	},
};
