import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
// import { expect } from '@storybook/jest'; // Removed
import { FbtContext, IntlVariations } from 'fbt';
import { FeedingSession } from '@/types/feeding';
import HeatMap from './heat-map';

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

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
		breast: 'left', // Not relevant for this component
		durationInSeconds: durationMinutes * 60,
		endTime: endTime.toISOString(),
		id,
		startTime: startTime.toISOString(),
	};
};

const sampleSessions: FeedingSession[] = [
	// Morning peak
	createSession('s1', 7, 0, 30),
	createSession('s2', 7, 15, 20),
	createSession('s3', 7, 30, 25),
	createSession('s4', 8, 0, 30),
	// Mid-day
	createSession('s5', 12, 30, 45),
	createSession('s6', 13, 0, 30),
	// Evening peak
	createSession('s7', 18, 0, 20),
	createSession('s8', 18, 30, 30),
	createSession('s9', 19, 0, 25),
	// Late night
	createSession('s10', 22, 45, 40), // Spans midnight slightly if duration is long enough
	// Session that definitely spans midnight
	createSession('s11', 23, 50, 30), // Starts 23:50, ends 00:20 next day
];

const meta: Meta<typeof HeatMap> = {
	argTypes: {
		className: { control: 'text' },
		sessions: { control: 'object' },
	},
	component: HeatMap,
	decorators: [
		(Story) => (
			<FbtContext.Provider value={fbtContextValue}>
				<div style={{ margin: 'auto', maxWidth: '800px' }}>
					<Story />
				</div>
			</FbtContext.Provider>
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
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText('Daily Feeding Distribution'),
		).toBeInTheDocument();
		// Check for time markers
		await expect(canvas.getByText('00:00')).toBeInTheDocument();
		await expect(canvas.getByText('12:00')).toBeInTheDocument();
		await expect(canvas.getByText('24:00')).toBeInTheDocument();
		// Check for legend items
		await expect(canvas.getByText('Very High Activity')).toBeInTheDocument();
		await expect(canvas.getByText('Low Activity')).toBeInTheDocument();
	},
};

export const NoSessions: Story = {
	args: {
		sessions: [],
	},
	play: ({ canvasElement }) => {
		const cardTitle = within(canvasElement).queryByText(
			'Daily Feeding Distribution',
		);
		expect(cardTitle).not.toBeInTheDocument(); // Component returns null
	},
};

export const SparselyDistributedSessions: Story = {
	args: {
		sessions: [
			createSession('sparse1', 2, 0, 30), // Early morning
			createSession('sparse2', 14, 0, 30), // Afternoon
			createSession('sparse3', 22, 0, 30), // Late evening
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText('Daily Feeding Distribution'),
		).toBeInTheDocument();
		// Visual inspection in Storybook would be best here to see the sparse heat map
	},
};

export const ConcentratedActivity: Story = {
	args: {
		sessions: [
			// All around 9 AM
			createSession('c1', 8, 45, 20),
			createSession('c2', 8, 50, 30),
			createSession('c3', 9, 0, 25),
			createSession('c4', 9, 5, 30),
			createSession('c5', 9, 10, 20),
			createSession('c6', 9, 15, 20),
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText('Daily Feeding Distribution'),
		).toBeInTheDocument();
		// Visual inspection needed for concentration
	},
};

export const SessionsSpanningMidnightExactly: Story = {
	args: {
		sessions: [
			createSession('midnight1', 23, 30, 60), // 23:30 to 00:30
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText('Daily Feeding Distribution'),
		).toBeInTheDocument();
		// Check that intervals at both end of day and start of day are colored
		// This is hard to assert programmatically without inspecting styles of many divs
	},
};

// Note: Asserting the exact color of each of the 288 divs is impractical.
// These tests focus on the presence of key elements. Visual testing or snapshot testing
// would be more effective for the heat map's visual output.
