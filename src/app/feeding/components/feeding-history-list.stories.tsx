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

const sessionEntries = sampleSessions.map((session) => ({
	id: session.id,
	startTime: session.startTime,
}));

const meta: Meta<typeof HistoryList> = {
	argTypes: {
		onSessionDelete: { action: 'sessionDeleted' },
		onSessionUpdate: { action: 'sessionUpdated' },
		sessionEntries: { control: 'object' },
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
		sessionEntries: [...sessionEntries],
	},
};

export const Empty: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessionEntries: [],
	},
};

export const SingleSessionLeft: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessionEntries: [
			{ id: sampleSessions[0].id, startTime: sampleSessions[0].startTime },
		],
	},
};

export const SingleSessionRight: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessionEntries: [
			{ id: sampleSessions[1].id, startTime: sampleSessions[1].startTime },
		],
	},
};

export const SessionCrossingMidnight: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessionEntries: [
			{
				id: 'midnight-crosser',
				startTime: new Date(
					now.getFullYear(),
					now.getMonth(),
					now.getDate() - 1,
					23,
					50,
				).toISOString(),
			},
		],
	},
};

export const DeleteSessionInteraction: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessionEntries: [
			{ id: sampleSessions[0].id, startTime: sampleSessions[0].startTime },
			{ id: sampleSessions[1].id, startTime: sampleSessions[1].startTime },
		],
	},
};

export const EditSessionInteraction: Story = {
	args: {
		onSessionDelete: () => {},
		onSessionUpdate: () => {},
		sessionEntries: [
			{ id: sampleSessions[0].id, startTime: sampleSessions[0].startTime },
		],
	},
};
