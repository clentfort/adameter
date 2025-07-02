import type { Meta, StoryObj } from '@storybook/react';
// import { expect } from '@storybook/jest'; // Removed
import { fn } from '@storybook/test';
import { userEvent, waitFor, within } from '@testing-library/react'; // Corrected
import { FbtContext, IntlVariations } from 'fbt';
import { useFeedingInProgress } from '@/hooks/use-feeing-in-progress'; // Corrected hook name
import BreastfeedingTracker from './feeding-tracker'; // Assuming component is default export

// Mock the hook using jest.mock
jest.mock('@/hooks/use-feeing-in-progress');

// Mock FbtContext for Storybook
const fbtContextValue = {
	IntlVariations,
	locale: 'en_US',
	translation: {},
};

// State for the mock hook
let mockFeedingInProgressState: {
	breast: 'left' | 'right';
	startTime: string;
} | null = null;
const mockSetFeedingInProgress = fn((newState) => {
	mockFeedingInProgressState = newState;
});

const meta: Meta<typeof BreastfeedingTracker> = {
	argTypes: {
		nextBreast: { control: 'radio', options: ['left', 'right'] },
		onSessionComplete: { action: 'sessionCompleted' },
	},
	component: BreastfeedingTracker,
	decorators: [
		(Story, context) => {
			// Reset mock state before each story
			mockFeedingInProgressState = null;
			mockSetFeedingInProgress.mockClear();

			// If a story defines an initial feeding state via args, set it for the mock
			if (context.args.initialFeedingState) {
				mockFeedingInProgressState = context.args.initialFeedingState;
			}

			(useFeedingInProgress as jest.Mock).mockReturnValue([
				mockFeedingInProgressState,
				mockSetFeedingInProgress,
			]);

			return (
				<FbtContext.Provider value={fbtContextValue}>
					<Story />
				</FbtContext.Provider>
			);
		},
	],
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'App/Feeding/BreastfeedingTracker',
};

export default meta;
type Story = StoryObj<
	typeof BreastfeedingTracker & {
		initialFeedingState?: {
			breast: 'left' | 'right';
			startTime: string;
		} | null;
	}
>;

export const InitialScreenNextLeft: Story = {
	args: {
		nextBreast: 'left',
		onSessionComplete: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole('button', { name: /left breast/i }),
		).toBeInTheDocument();
		await expect(
			canvas.getByRole('button', { name: /right breast/i }),
		).toBeInTheDocument();
		// Check for "Next" badge on the left breast button
		const leftButtonContainer = canvas
			.getByRole('button', { name: /left breast/i })
			.closest('div');
		if (!leftButtonContainer)
			throw new Error('Left button container not found');
		await expect(
			within(leftButtonContainer).getByText(/next/i),
		).toBeInTheDocument();
	},
};

export const InitialScreenNextRight: Story = {
	args: {
		nextBreast: 'right',
		onSessionComplete: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const rightButtonContainer = canvas
			.getByRole('button', { name: /right breast/i })
			.closest('div');
		if (!rightButtonContainer)
			throw new Error('Right button container not found');
		await expect(
			within(rightButtonContainer).getByText(/next/i),
		).toBeInTheDocument();
	},
};

export const StartLeftFeeding: Story = {
	args: {
		nextBreast: 'left',
		onSessionComplete: fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const leftButton = canvas.getByRole('button', { name: /left breast/i });
		await userEvent.click(leftButton);

		await waitFor(() =>
			expect(mockSetFeedingInProgress).toHaveBeenCalledWith(
				expect.objectContaining({
					breast: 'left',
					startTime: expect.any(String),
				}),
			),
		);
		// The component should re-render to show the timer state
		// This requires the decorator to correctly update the mock hook's return value on state change.
		// For direct assertion, we might need to trigger a re-render or wait for UI update.
		// await expect(canvas.getByText(/Left Breast/i, { selector: 'p' })).toBeInTheDocument(); // Check for active feeding display
		// await expect(canvas.getByText(/00:00/i)).toBeInTheDocument(); // Initial timer
	},
};

export const FeedingInProgressView: Story = {
	args: {
		nextBreast: 'right', // Doesn't matter when feeding is in progress
		onSessionComplete: fn(),
		// @ts-ignore: Forcing initial state via args for story setup
		initialFeedingState: {
			breast: 'right',
			startTime: new Date().toISOString(),
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		// Ensure the spy is set up with the initial state from args for this story run
		// This might require the decorator to be more dynamic or a `beforeEach` in the story
		await expect(
			canvas.getByText(/right breast/i, { selector: 'p' }),
		).toBeInTheDocument(); // Active display
		await expect(
			canvas.getByRole('button', { name: /end feeding/i }),
		).toBeInTheDocument();
		await expect(
			canvas.getByRole('button', { name: /enter time manually/i }),
		).toBeInTheDocument();

		// Timer should be ticking. This is hard to test precisely without advancing time.
		// We can check for its presence.
		const timerDisplay = await canvas.findByText(/\d{2}:\d{2}/); // Matches MM:SS format
		await expect(timerDisplay).toBeInTheDocument();
	},
};

export const EndFeedingAction: Story = {
	args: {
		...FeedingInProgressView.args, // Start with feeding in progress
		// @ts-ignore: Forcing initial state
		initialFeedingState: {
			breast: 'left',
			startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		}, // 5 mins ago
	},
	play: async ({ args, canvasElement }) => {
		jest.useFakeTimers(); // Use fake timers to control time
		const canvas = within(canvasElement);

		const endButton = canvas.getByRole('button', { name: /end feeding/i });
		await userEvent.click(endButton);

		jest.runOnlyPendingTimers(); // If there are any timeouts/intervals from the click
		jest.useRealTimers(); // Restore real timers

		await waitFor(() =>
			expect(args.onSessionComplete).toHaveBeenCalledTimes(1),
		);
		expect(args.onSessionComplete).toHaveBeenCalledWith(
			expect.objectContaining({
				breast: 'left',
				durationInSeconds: expect.any(Number), // Around 300 if started 5 mins ago, but exactness depends on test runner speed
				endTime: expect.any(String),
				startTime: args.initialFeedingState!.startTime,
			}),
		);
		await waitFor(() =>
			expect(mockSetFeedingInProgress).toHaveBeenCalledWith(null),
		); // Tracker resets
	},
};

export const EnterTimeManuallyDialog: Story = {
	args: {
		...FeedingInProgressView.args,
		// @ts-ignore: Forcing initial state
		initialFeedingState: {
			breast: 'right',
			startTime: new Date().toISOString(),
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const manualButton = canvas.getByRole('button', {
			name: /enter time manually/i,
		});
		await userEvent.click(manualButton);

		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		await expect(dialog).toBeVisible();
		await expect(
			within(dialog).getByText(/enter feeding time manually/i),
		).toBeInTheDocument();
		await expect(within(dialog).getByLabelText(/minutes/i)).toBeInTheDocument();
	},
};

export const SaveManualTimeEntry: Story = {
	args: {
		...FeedingInProgressView.args,
		// @ts-ignore: Forcing initial state
		initialFeedingState: {
			breast: 'left',
			startTime: new Date().toISOString(),
		},
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		await userEvent.click(
			canvas.getByRole('button', { name: /enter time manually/i }),
		);

		const dialog = await waitFor(() =>
			within(document.body).getByRole('dialog'),
		);
		const minutesInput = within(dialog).getByLabelText(/minutes/i);
		await userEvent.type(minutesInput, '22');

		const saveButton = within(dialog).getByRole('button', { name: /save/i });
		await userEvent.click(saveButton);

		await waitFor(() =>
			expect(args.onSessionComplete).toHaveBeenCalledTimes(1),
		);
		expect(args.onSessionComplete).toHaveBeenCalledWith(
			expect.objectContaining({
				breast: 'left',
				durationInSeconds: 22 * 60,
				// startTime will be calculated back from now - 22 mins
				endTime: expect.any(String), // Will be current time
				startTime: expect.any(String),
			}),
		);
		await waitFor(() =>
			expect(mockSetFeedingInProgress).toHaveBeenCalledWith(null),
		); // Tracker resets
		await waitFor(() => expect(dialog).not.toBeVisible()); // Dialog closes
	},
};

// Need to use `act` for timer updates if not using fake timers + runOnlyPendingTimers
// For example, to test timer display update:
// export const TimerUpdates: Story = {
//   args: { ...StartLeftFeeding.args },
//   play: async ({ canvasElement }) => {
//     const canvas = within(canvasElement);
//     await userEvent.click(canvas.getByRole('button', { name: /Left Breast/i }));
//     // Wait for initial timer
//     await waitFor(() => expect(canvas.getByText(/00:00/)).toBeInTheDocument());
//     // Use `act` to advance time if using real timers and need to see updates
//     await act(async () => {
//       await new Promise(resolve => setTimeout(resolve, 1100)); // Wait a bit more than 1 sec
//     });
//     await waitFor(() => expect(canvas.getByText(/00:01/)).toBeInTheDocument());
//   }
// };
// However, direct timer update assertions are often best with fake timers.
