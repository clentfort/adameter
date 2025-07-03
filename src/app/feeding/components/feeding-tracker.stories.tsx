import type { Meta, StoryObj } from '@storybook/react';
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { useFeedingInProgress } from '@/hooks/use-feeing-in-progress';
import BreastfeedingTracker from './feeding-tracker';

vi.mock('@/hooks/use-feeing-in-progress');

let mockFeedingInProgressState: {
	breast: 'left' | 'right';
	startTime: string;
} | null = null;
const mockSetFeedingInProgress = vi.fn((newState) => {
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
			mockFeedingInProgressState = null;
			mockSetFeedingInProgress.mockClear();

			if (context.args.initialFeedingState) {
				mockFeedingInProgressState = context.args.initialFeedingState;
			}

			(useFeedingInProgress as import('vitest').Mock).mockReturnValue([
				mockFeedingInProgressState,
				mockSetFeedingInProgress,
			]);
			return <Story />;
		},
	],
	parameters: {
		docs: {
			story: {
				height: '100vh',
				inline: false,
			},
		},
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
		onSessionComplete: vi.fn(),
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByRole('button', { name: /left breast/i }),
		).toBeInTheDocument();
		await expect(
			canvas.getByRole('button', { name: /right breast/i }),
		).toBeInTheDocument();
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
		onSessionComplete: vi.fn(),
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
		onSessionComplete: vi.fn(),
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
	},
};

export const FeedingInProgressView: Story = {
	args: {
		nextBreast: 'right',
		onSessionComplete: vi.fn(),
		// @ts-ignore: Forcing initial state via args for story setup
		initialFeedingState: {
			breast: 'right',
			startTime: new Date().toISOString(),
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		await expect(
			canvas.getByText(/right breast/i, { selector: 'p' }),
		).toBeInTheDocument();
		await expect(
			canvas.getByRole('button', { name: /end feeding/i }),
		).toBeInTheDocument();
		await expect(
			canvas.getByRole('button', { name: /enter time manually/i }),
		).toBeInTheDocument();

		const timerDisplay = await canvas.findByText(/\d{2}:\d{2}/);
		await expect(timerDisplay).toBeInTheDocument();
	},
};

export const EndFeedingAction: Story = {
	args: {
		...FeedingInProgressView.args,
		// @ts-ignore: Forcing initial state
		initialFeedingState: {
			breast: 'left',
			startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		},
	},
	play: async ({ args, canvasElement }) => {
		vi.useFakeTimers();
		const canvas = within(canvasElement);

		const endButton = canvas.getByRole('button', { name: /end feeding/i });
		await userEvent.click(endButton);

		vi.runOnlyPendingTimers();
		vi.useRealTimers();

		await waitFor(() =>
			expect(args.onSessionComplete).toHaveBeenCalledTimes(1),
		);
		expect(args.onSessionComplete).toHaveBeenCalledWith(
			expect.objectContaining({
				breast: 'left',
				durationInSeconds: expect.any(Number),
				endTime: expect.any(String),
				startTime: args.initialFeedingState!.startTime,
			}),
		);
		await waitFor(() =>
			expect(mockSetFeedingInProgress).toHaveBeenCalledWith(null),
		);
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
				endTime: expect.any(String),
				startTime: expect.any(String),
			}),
		);
		await waitFor(() =>
			expect(mockSetFeedingInProgress).toHaveBeenCalledWith(null),
		);
		await waitFor(() => expect(dialog).not.toBeVisible());
	},
};
