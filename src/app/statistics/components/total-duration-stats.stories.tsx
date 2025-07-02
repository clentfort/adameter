import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
// import { expect } from '@storybook/jest'; // Removed
import { FbtContext, IntlVariations } from 'fbt';
import { FeedingSession } from '@/types/feeding';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import TotalDurationStats from './total-duration-stats';

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

const createSession = (id: string, durationMinutes: number): FeedingSession => {
	const startTime = new Date(); // Exact start time doesn't affect duration stats
	const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
	return {
		breast: 'left', // Not relevant for this stat
		durationInSeconds: durationMinutes * 60,
		endTime: endTime.toISOString(),
		id,
		startTime: startTime.toISOString(),
	};
};

const sampleSessions: FeedingSession[] = [
	createSession('s1', 15),
	createSession('s2', 20),
	createSession('s3', 12),
	createSession('s4', 18),
]; // Total duration: 15+20+12+18 = 65 minutes

const meta: Meta<typeof TotalDurationStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: TotalDurationStats,
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
	title: 'App/Statistics/TotalDurationStats',
};

export default meta;
type Story = StoryObj<typeof TotalDurationStats>;

export const DefaultView: Story = {
	args: {
		sessions: sampleSessions,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText('Total feeding duration'),
		).toBeInTheDocument();
		// Total duration: 65 minutes = 3900 seconds
		await expect(
			canvas.getByText(formatDurationAbbreviated(65 * 60)),
		).toBeInTheDocument();
	},
};

export const NoSessions: Story = {
	args: {
		sessions: [],
	},
	play: ({ canvasElement }) => {
		const cardTitle = within(canvasElement).queryByText(
			'Total feeding duration',
		);
		expect(cardTitle).not.toBeInTheDocument(); // Component returns null
	},
};

export const SingleSession: Story = {
	args: {
		sessions: [createSession('s1', 25)], // 25 minutes
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(25 * 60)),
		).toBeInTheDocument();
	},
};

export const LongDurations: Story = {
	args: {
		sessions: [
			createSession('s1', 60), // 1 hour
			createSession('s2', 75), // 1 hour 15 minutes
			createSession('s3', 90), // 1 hour 30 minutes
		], // Total: 60+75+90 = 225 minutes
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(225 * 60)),
		).toBeInTheDocument();
	},
};
