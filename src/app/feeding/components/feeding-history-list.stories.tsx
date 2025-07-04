import type { Meta, StoryObj } from '@storybook/react';
import { FeedingSession } from '@/types/feeding';
import HistoryList from './feeding-history-list';

const now = new Date();
const time = (offsetHours: number, offsetMinutes: number = 0): Date => {
	const d = new Date(now);
	d.setHours(
		now.getHours() - offsetHours,
		now.getMinutes() - offsetMinutes,
		0,
		0,
	);
	return d;
};

const createSession = (
	id: string,
	breast: 'left' | 'right',
	startTime: Date,
	durationMinutes: number,
): FeedingSession => {
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
	createSession('s1', 'left', time(0, 30), 15),
	createSession('s2', 'right', time(1, 0), 20),
	createSession('s3', 'left', time(2, 15), 10),
	createSession('s4', 'right', time(23, 50), 25),
	createSession('s5', 'left', time(48, 0), 18),
];

const meta: Meta<typeof HistoryList> = {
	argTypes: {
		onSessionDelete: { action: 'sessionDeleted' },
		onSessionUpdate: { action: 'sessionUpdated' },
		sessions: { control: 'object' },
	},
	component: HistoryList,
	parameters: {
		layout: 'padded',
	},
	tags: ['autodocs'],
	title: 'App/Feeding/FeedingHistoryList',
};

export default meta;
type Story = StoryObj<typeof HistoryList>;

export const Default: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessions: [...sampleSessions],
	},
};

export const Empty: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessions: [],
	},
};

export const SingleSessionLeft: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessions: [sampleSessions[0]],
	},
};

export const SingleSessionRight: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessions: [sampleSessions[1]],
	},
};

export const SessionCrossingMidnight: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessions: [
			createSession(
				'midnight-crosser',
				'left',
				new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 50),
				30,
			),
		],
	},
};

export const DeleteSessionInteraction: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessions: [sampleSessions[0], sampleSessions[1]],
	},
};

export const EditSessionInteraction: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessions: [sampleSessions[0]],
	},
};
