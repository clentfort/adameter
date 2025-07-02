import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
// import { expect } from '@storybook/jest'; // Removed
import { FbtContext, IntlVariations } from 'fbt';
import { FeedingSession } from '@/types/feeding';
import FeedingsPerDayStats from './feedings-per-day-stats';

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
	breast: 'left', // Breast doesn't matter for this stat
	durationInSeconds: 15 * 60,
	endTime: new Date(
		new Date(startTime).getTime() + 15 * 60 * 1000,
	).toISOString(), // Dummy end time
	id,
	startTime,
});

const sampleSessions: FeedingSession[] = [
	// Day 0 (Today)
	createSession('s1', createTimestamp(0, 8)),
	createSession('s2', createTimestamp(0, 12)),
	createSession('s3', createTimestamp(0, 16)),
	// Day 1 (Yesterday)
	createSession('s4', createTimestamp(1, 9)),
	createSession('s5', createTimestamp(1, 13)),
	// Day 2 (Day before yesterday)
	createSession('s6', createTimestamp(2, 10)),
	createSession('s7', createTimestamp(2, 14)),
	createSession('s8', createTimestamp(2, 18)),
	createSession('s9', createTimestamp(2, 22)),
];
// Total feedings: 9. Distinct days: 3. Avg: 9/3 = 3.0

const meta: Meta<typeof FeedingsPerDayStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: FeedingsPerDayStats,
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
	title: 'App/Statistics/FeedingsPerDayStats',
};

export default meta;
type Story = StoryObj<typeof FeedingsPerDayStats>;

export const DefaultView: Story = {
	args: {
		sessions: sampleSessions,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('Feedings Per Day')).toBeInTheDocument();
		await expect(canvas.getByText('3.0')).toBeInTheDocument(); // 9 feedings / 3 days
	},
};

export const DifferentDistribution: Story = {
	args: {
		sessions: [
			createSession('d1s1', createTimestamp(0, 10)), // Day 0: 1 feeding
			createSession('d2s1', createTimestamp(1, 8)), // Day 1: 3 feedings
			createSession('d2s2', createTimestamp(1, 12)),
			createSession('d2s3', createTimestamp(1, 16)),
			createSession('d3s1', createTimestamp(2, 11)), // Day 2: 2 feedings
			createSession('d3s2', createTimestamp(2, 15)),
		], // Total feedings: 6. Distinct days: 3. Avg: 6/3 = 2.0
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('2.0')).toBeInTheDocument();
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
		], // Total feedings: 5. Distinct days: 1. Avg: 5/1 = 5.0
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('5.0')).toBeInTheDocument();
	},
};

export const NoSessions: Story = {
	args: {
		sessions: [],
	},
	play: ({ canvasElement }) => {
		const cardTitle = within(canvasElement).queryByText('Feedings Per Day');
		expect(cardTitle).not.toBeInTheDocument(); // Component returns null
	},
};

export const OneSession: Story = {
	args: {
		sessions: [createSession('s1', createTimestamp(0, 12))], // 1 feeding / 1 day = 1.0
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(canvas.getByText('1.0')).toBeInTheDocument();
	},
};
