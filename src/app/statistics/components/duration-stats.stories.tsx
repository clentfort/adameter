import type { Meta, StoryObj } from '@storybook/react';
import { within } from '@testing-library/react';
import { FeedingSession } from '@/types/feeding';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import DurationStats from './duration-stats';

const createSession = (
	id: string,
	breast: 'left' | 'right',
	durationMinutes: number,
): FeedingSession => {
	const startTime = new Date();
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
];

const meta: Meta<typeof DurationStats> = {
	argTypes: {
		sessions: { control: 'object' },
	},
	component: DurationStats,
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
		await expect(
			canvas.getByText(formatDurationAbbreviated(Math.round((103 * 60) / 6))),
		).toBeInTheDocument();
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
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(Math.round((37 * 60) / 3))),
		).toBeInTheDocument();
		await expect(
			canvas
				.getByText(formatDurationAbbreviated(Math.round((37 * 60) / 3)))
				.closest('div'),
		).toHaveTextContent(/Left Breast/);
		await expect(
			canvas.getByText(formatDurationAbbreviated(0)).closest('div'),
		).toHaveTextContent(/Right Breast/);
	},
};

export const OnlyRightBreastSessions: Story = {
	args: {
		sessions: [
			createSession('s1', 'right', 20),
			createSession('s2', 'right', 25),
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(formatDurationAbbreviated(Math.round((45 * 60) / 2))),
		).toBeInTheDocument();
		await expect(
			canvas.getByText(formatDurationAbbreviated(0)).closest('div'),
		).toHaveTextContent(/Left Breast/);
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
		).toBeInTheDocument();
		await expect(
			canvas.getByText(formatDurationAbbreviated(13 * 60)).closest('div'),
		).toHaveTextContent(/Left Breast/);
		await expect(
			canvas.getByText(formatDurationAbbreviated(0)).closest('div'),
		).toHaveTextContent(/Right Breast/);
	},
};
