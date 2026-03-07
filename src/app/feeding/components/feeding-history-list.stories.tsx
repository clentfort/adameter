import type { Meta, StoryObj } from '@storybook/react';
import type { FeedingSession } from '@/types/feeding';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { TinybaseIndexesProvider } from '@/contexts/tinybase-indexes-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
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

// Create a store with sample sessions for stories
function createStoreWithSessions(sessions: FeedingSession[]) {
	const store = createStore();
	for (const session of sessions) {
		store.setRow(TABLE_IDS.FEEDING_SESSIONS, session.id, {
			breast: session.breast,
			durationInSeconds: session.durationInSeconds,
			endTime: session.endTime,
			startTime: session.startTime,
		});
	}
	return store;
}

// Wrapper component that provides TinyBase context
function StoryWrapper({
	children,
	sessions,
}: {
	children: React.ReactNode;
	sessions: FeedingSession[];
}) {
	const store = createStoreWithSessions(sessions);
	return (
		<Provider store={store}>
			<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
		</Provider>
	);
}

const meta: Meta<typeof HistoryList> = {
	argTypes: {
		onSessionDelete: { action: 'sessionDeleted' },
		onSessionUpdate: { action: 'sessionUpdated' },
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
	render: (args) => (
		<StoryWrapper sessions={sampleSessions}>
			<HistoryList {...args} />
		</StoryWrapper>
	),
};

export const Empty: Story = {
	render: (args) => (
		<StoryWrapper sessions={[]}>
			<HistoryList {...args} />
		</StoryWrapper>
	),
};

export const SingleSessionLeft: Story = {
	render: (args) => (
		<StoryWrapper sessions={[sampleSessions[0]]}>
			<HistoryList {...args} />
		</StoryWrapper>
	),
};

export const SingleSessionRight: Story = {
	render: (args) => (
		<StoryWrapper sessions={[sampleSessions[1]]}>
			<HistoryList {...args} />
		</StoryWrapper>
	),
};

export const SessionCrossingMidnight: Story = {
	render: (args) => (
		<StoryWrapper
			sessions={[
				createSession(
					'midnight-crosser',
					'left',
					new Date(
						now.getFullYear(),
						now.getMonth(),
						now.getDate() - 1,
						23,
						50,
					),
					30,
				),
			]}
		>
			<HistoryList {...args} />
		</StoryWrapper>
	),
};

export const DeleteSessionInteraction: Story = {
	render: (args) => (
		<StoryWrapper sessions={[sampleSessions[0], sampleSessions[1]]}>
			<HistoryList {...args} />
		</StoryWrapper>
	),
};

export const EditSessionInteraction: Story = {
	render: (args) => (
		<StoryWrapper sessions={[sampleSessions[0]]}>
			<HistoryList {...args} />
		</StoryWrapper>
	),
};
