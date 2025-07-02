import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
// import { expect } from '@storybook/jest'; // Removed
import { FbtContext, IntlVariations } from 'fbt';
import { FeedingSession } from '@/types/feeding';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import TimeBetweenStats from './time-between-stats';

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

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
	breast: 'left', // Not relevant for this stat
	durationInSeconds: 15 * 60,
	endTime: new Date(
		new Date(startTime).getTime() + 15 * 60 * 1000,
	).toISOString(), // Dummy
	id,
	startTime,
});

const sampleSessions: FeedingSession[] = [
	createSession('s1', createTimestamp(0, 8)), // 8:00
	createSession('s2', createTimestamp(0, 11)), // 11:00 (3h diff)
	createSession('s3', createTimestamp(0, 13, 30)), // 13:30 (2.5h diff)
	createSession('s4', createTimestamp(0, 16)), // 16:00 (2.5h diff)
	createSession('s5', createTimestamp(1, 7)), // 7:00 yesterday (large diff, not counted with s4 due to sort order)
	// Sorted: s4, s3, s2, s1, s5
	// Diff s4-s3: 2.5h = 9000s
	// Diff s3-s2: 2.5h = 9000s
	// Diff s2-s1: 3.0h = 10800s
	// Diff s1-s5: (24-8+7)h = 23h = 82800s
	// Total diff: 9000+9000+10800+82800 = 111600
	// Count: 4
	// Avg: 111600 / 4 = 27900 seconds => 7h 45m
];

const meta: Meta<typeof TimeBetweenStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: TimeBetweenStats,
	decorators: [
		(Story) => (
			<FbtContext.Provider value={fbtContextValue}>
				<div style={{ width: '300px' }}>
					<Story />
				</div>
			</FbtContext.Provider>
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Time Between Feedings')).toBeInTheDocument();
		// Avg: 27900s. formatDurationAbbreviated(27900) -> "7h 45m"
		await expect(
			canvas.getByText(formatDurationAbbreviated(27_900)),
		).toBeInTheDocument();
	},
};

export const RegularIntervals: Story = {
	args: {
		sessions: [
			// Exactly 3 hours apart
			createSession('r1', createTimestamp(0, 6)),
			createSession('r2', createTimestamp(0, 9)),
			createSession('r3', createTimestamp(0, 12)),
			createSession('r4', createTimestamp(0, 15)),
		], // Avg: 3h = 10800s
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(3 * 60 * 60)),
		).toBeInTheDocument();
	},
};

export const NoSessions: Story = {
	args: {
		sessions: [],
	},
	play: ({ canvasElement }) => {
		const cardTitle = within(canvasElement).queryByText(
			'Time Between Feedings',
		);
		expect(cardTitle).not.toBeInTheDocument(); // Component returns null
	},
};

export const OneSession: Story = {
	args: {
		sessions: [createSession('s1', createTimestamp(0, 12))],
	},
	play: ({ canvasElement }) => {
		const cardTitle = within(canvasElement).queryByText(
			'Time Between Feedings',
		);
		expect(cardTitle).not.toBeInTheDocument(); // Component returns null
	},
};

export const TwoSessionsCloseTogether: Story = {
	args: {
		sessions: [
			createSession('s1', createTimestamp(0, 12, 0)),
			createSession('s2', createTimestamp(0, 12, 30)), // 30m diff
		], // Avg: 30m = 1800s
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(30 * 60)),
		).toBeInTheDocument();
	},
};

export const SessionsWithZeroTimeBetween: Story = {
	args: {
		sessions: [
			createSession('s1', createTimestamp(0, 12, 0)),
			createSession('s2', createTimestamp(0, 12, 0)), // Same start time
			createSession('s3', createTimestamp(0, 15, 0)), // 3h diff from s2
		],
		// Sorted: s3, s2, s1 (or s3, s1, s2)
		// Diff s3-s2: 3h = 10800
		// Diff s2-s1: 0 (ignored)
		// Avg: 10800s / 1 = 10800s => 3h
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(3 * 60 * 60)),
		).toBeInTheDocument();
	},
};
