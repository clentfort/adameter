import type { Meta, StoryObj } from '@storybook/react';
// import { expect } from '@storybook/jest'; // Removed
import { fn } from '@storybook/test';
import { userEvent, waitFor, within } from '@testing-library/react'; // Corrected
import { FbtContext, IntlVariations } from 'fbt';
import { FeedingSession } from '@/types/feeding';
import HistoryList from './feeding-history-list'; // Renamed to avoid conflict with internal HistoryList

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

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
	createSession('s1', 'left', time(0, 30), 15), // 30 mins ago, 15 min duration
	createSession('s2', 'right', time(1, 0), 20), // 1 hour ago, 20 min
	createSession('s3', 'left', time(2, 15), 10), // 2h 15m ago, 10 min
	createSession('s4', 'right', time(23, 50), 25), // Yesterday ~23:50, 25 min (likely crosses midnight)
	createSession('s5', 'left', time(48, 0), 18), // Two days ago, 18 min
];

const meta: Meta<typeof HistoryList> = {
	argTypes: {
		onSessionDelete: { action: 'sessionDeleted' },
		onSessionUpdate: { action: 'sessionUpdated' },
		sessions: { control: 'object' },
	},
	component: HistoryList,
	decorators: [
		(Story) => (
			<FbtContext.Provider value={fbtContextValue}>
				<Story />
			</FbtContext.Provider>
		),
	],
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
		onSessionDelete: fn(),
		onSessionUpdate: fn(),
		sessions: [...sampleSessions], // Pass a copy
	},
};

export const Empty: Story = {
	args: {
		onSessionDelete: fn(),
		onSessionUpdate: fn(),
		sessions: [],
	},
	// HistoryListInternal renders the empty message, not this component directly.
	// So, we'd need to check for the absence of list items or a message from HistoryListInternal if it bubbles up.
	// For now, this story just shows it with no sessions.
};

export const SingleSessionLeft: Story = {
	args: {
		onSessionDelete: fn(),
		onSessionUpdate: fn(),
		sessions: [sampleSessions[0]],
	},
};

export const SingleSessionRight: Story = {
	args: {
		onSessionDelete: fn(),
		onSessionUpdate: fn(),
		sessions: [sampleSessions[1]],
	},
};

export const SessionCrossingMidnight: Story = {
	args: {
		onSessionDelete: fn(),
		onSessionUpdate: fn(),
		sessions: [
			createSession(
				'midnight-crosser',
				'left',
				new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 50),
				30,
			),
		], // Starts 23:50 yesterday, ends today 00:20
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/this session crosses midnight/i),
		).toBeInTheDocument();
	},
};

export const DeleteSessionInteraction: Story = {
	args: {
		onSessionDelete: fn(),
		onSessionUpdate: fn(),
		sessions: [sampleSessions[0], sampleSessions[1]],
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const sessionToDelete = args.sessions![0];

		// Find the delete button for the first session.
		// This relies on the order and structure; more robust selectors might be needed for complex lists.
		const allDeleteButtons = canvas.getAllByRole('button', { name: /delete/i });
		await userEvent.click(allDeleteButtons[0]); // Assuming first delete button corresponds to first session in display order

		const dialog = await waitFor(() =>
			within(document.body).getByRole('alertdialog'),
		);
		await expect(dialog).toBeVisible();

		const confirmDeleteButton = within(dialog).getByRole('button', {
			name: /delete/i,
		});
		await userEvent.click(confirmDeleteButton);

		await waitFor(() =>
			expect(args.onSessionDelete).toHaveBeenCalledWith(sessionToDelete.id),
		);
	},
};

export const EditSessionInteraction: Story = {
	args: {
		onSessionDelete: fn(),
		onSessionUpdate: fn(),
		sessions: [sampleSessions[0]],
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const sessionToEdit = args.sessions![0];

		const editButton = canvas.getByRole('button', { name: /edit/i });
		await userEvent.click(editButton);

		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog', {
				name: /edit feeding session/i,
			}),
		);
		await expect(dialog).toBeVisible();

		// Example: Change duration in the form
		const durationInput = within(dialog).getByLabelText(/minutes/i);
		await userEvent.clear(durationInput);
		await userEvent.type(durationInput, '25'); // New duration

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() =>
			expect(args.onSessionUpdate).toHaveBeenCalledWith(
				expect.objectContaining({
					durationInSeconds: 25 * 60,
					id: sessionToEdit.id,
				}),
			),
		);
	},
};

// Note: HistoryListInternal groups by date. For more complex visual assertions
// about grouping, ensure your sampleSessions cover different dates.
// The current sample sessions are mostly on the same day or consecutive days.
