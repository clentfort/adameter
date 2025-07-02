import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
// import { expect } from '@storybook/jest'; // Removed
import { FbtContext, IntlVariations } from 'fbt';
import { FeedingSession } from '@/types/feeding';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated'; // For verifying output
import DurationStats from './duration-stats';

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

const createSession = (
	id: string,
	breast: 'left' | 'right',
	durationMinutes: number,
): FeedingSession => {
	const startTime = new Date(); // Exact start time doesn't affect duration stats
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
	createSession('s1', 'left', 15),
	createSession('s2', 'right', 20),
	createSession('s3', 'left', 12),
	createSession('s4', 'right', 18),
	createSession('s5', 'left', 16),
	createSession('s6', 'right', 22),
]; // Total: 103 mins / 6 = 17.16 ~ 17m avg
// Left: (15+12+16) = 43 mins / 3 = 14.33 ~ 14m avg
// Right: (20+18+22) = 60 mins / 3 = 20m avg

const meta: Meta<typeof DurationStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: DurationStats,
	decorators: [
		(Story) => (
			<FbtContext.Provider value={fbtContextValue}>
				<div style={{ width: '300px' }}>
					{' '}
					{/* StatsCard might look better with some width constraint */}
					<Story />
				</div>
			</FbtContext.Provider>
		),
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Statistics/DurationStats',
};

export default meta;
type Story = StoryObj<typeof DurationStats>;

export const DefaultView: Story = {
	args: {
		sessions: sampleSessions,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText('Average Feeding Duration'),
		).toBeInTheDocument();
		// Verify calculated averages.
		// Total avg: (15+20+12+18+16+22)*60 / 6 = 103*60 / 6 = 1030 seconds. formatDurationAbbreviated(1030) -> "17m" (approx)
		// Left avg: (15+12+16)*60 / 3 = 43*60 / 3 = 860 seconds. formatDurationAbbreviated(860) -> "14m" (approx)
		// Right avg: (20+18+22)*60 / 3 = 60*60 / 3 = 1200 seconds. formatDurationAbbreviated(1200) -> "20m"
		await expect(
			canvas.getByText(formatDurationAbbreviated(Math.round((103 * 60) / 6))),
		).toBeInTheDocument(); // Total
		await expect(
			canvas
				.getByText(formatDurationAbbreviated(Math.round((43 * 60) / 3)))
				.closest('div'),
		).toHaveTextContent(/Left Breast/);
		await expect(
			canvas
				.getByText(formatDurationAbbreviated(Math.round((60 * 60) / 3)))
				.closest('div'),
		).toHaveTextContent(/Right Breast/);
	},
};

export const OnlyLeftBreastSessions: Story = {
	args: {
		sessions: [
			createSession('s1', 'left', 10),
			createSession('s2', 'left', 15),
			createSession('s3', 'left', 12),
		], // Avg: (10+15+12)/3 = 37/3 = 12.33 ~ 12m
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(Math.round((37 * 60) / 3))),
		).toBeInTheDocument(); // Total
		await expect(
			canvas
				.getByText(formatDurationAbbreviated(Math.round((37 * 60) / 3)))
				.closest('div'),
		).toHaveTextContent(/Left Breast/);
		await expect(
			canvas.getByText(formatDurationAbbreviated(0)).closest('div'),
		).toHaveTextContent(/Right Breast/); // Right should be 0m
	},
};

export const OnlyRightBreastSessions: Story = {
	args: {
		sessions: [
			createSession('s1', 'right', 20),
			createSession('s2', 'right', 25),
		], // Avg: (20+25)/2 = 22.5 ~ 23m
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(Math.round((45 * 60) / 2))),
		).toBeInTheDocument(); // Total
		await expect(
			canvas.getByText(formatDurationAbbreviated(0)).closest('div'),
		).toHaveTextContent(/Left Breast/); // Left should be 0m
		await expect(
			canvas
				.getByText(formatDurationAbbreviated(Math.round((45 * 60) / 2)))
				.closest('div'),
		).toHaveTextContent(/Right Breast/);
	},
};

export const NoSessions: Story = {
	args: {
		sessions: [],
	},
	play: ({ canvasElement }) => {
		// The component returns null if sessions.length === 0, so the canvas should be empty or not contain the card.
		const cardTitle = within(canvasElement).queryByText(
			'Average Feeding Duration',
		);
		expect(cardTitle).not.toBeInTheDocument();
	},
};

export const SingleSession: Story = {
	args: {
		sessions: [createSession('s1', 'left', 13)],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(13 * 60)),
		).toBeInTheDocument(); // Total
		await expect(
			canvas.getByText(formatDurationAbbreviated(13 * 60)).closest('div'),
		).toHaveTextContent(/Left Breast/);
		await expect(
			canvas.getByText(formatDurationAbbreviated(0)).closest('div'),
		).toHaveTextContent(/Right Breast/);
	},
};
