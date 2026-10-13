import type { FeedingSession } from '@/types/feeding';
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_FEEDING_IN_PROGRESS } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import BreastfeedingTracker from './feeding-tracker';

describe('BreastfeedingTracker', () => {
	const mockOnSaveSession = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it('renders start feeding buttons when no session is in progress', () => {
		const store = createTestStore();
		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onSaveSession={mockOnSaveSession}
				/>
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByText('Left Breast')).toBeInTheDocument();
		expect(screen.getByText('Right Breast')).toBeInTheDocument();
		expect(screen.getByText('Next')).toBeInTheDocument();
	});

	it('pre-generates the session ID and sets feedingInProgress when starting feeding', () => {
		const store = createTestStore();
		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onSaveSession={mockOnSaveSession}
				/>
			</TinyBaseTestWrapper>,
		);

		fireEvent.click(screen.getByText('Left Breast'));

		const rawVal = store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS) as string;
		expect(rawVal).toBeDefined();

		const parsed = JSON.parse(rawVal);
		expect(parsed.breast).toBe('left');
		expect(parsed.id).toMatch(/^[\w-]{21}$/);
	});

	it('ends feeding session using the pre-generated ID', () => {
		const store = createTestStore();
		const pregenId = 'pregenerated-session-id';

		store.setValue(
			STORE_VALUE_FEEDING_IN_PROGRESS,
			JSON.stringify({
				breast: 'left',
				id: pregenId,
				startTime: new Date(Date.now() - 60_000).toISOString(),
			}),
		);

		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onSaveSession={mockOnSaveSession}
				/>
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByText('End Feeding')).toBeInTheDocument();

		fireEvent.click(screen.getByText('End Feeding'));

		expect(mockOnSaveSession).toHaveBeenCalledTimes(1);
		const createdSession: FeedingSession = mockOnSaveSession.mock.calls[0][0];
		expect(createdSession.id).toBe(pregenId);
		expect(createdSession.breast).toBe('left');

		expect(store.hasValue(STORE_VALUE_FEEDING_IN_PROGRESS)).toBe(false);
	});

	it('generates an ID when ending a legacy session without one', () => {
		const store = createTestStore();
		store.setValue(
			STORE_VALUE_FEEDING_IN_PROGRESS,
			JSON.stringify({
				breast: 'left',
				startTime: new Date(Date.now() - 60_000).toISOString(),
			}),
		);

		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onSaveSession={mockOnSaveSession}
				/>
			</TinyBaseTestWrapper>,
		);

		fireEvent.click(screen.getByText('End Feeding'));

		const savedSession: FeedingSession = mockOnSaveSession.mock.calls[0][0];
		expect(savedSession.id).toMatch(/^[\w-]{21}$/);
	});

	it('saves a manual entry with the pre-generated ID', async () => {
		const store = createTestStore();
		const sessionId = 'session-running-123';

		store.setValue(
			STORE_VALUE_FEEDING_IN_PROGRESS,
			JSON.stringify({
				breast: 'right',
				id: sessionId,
				startTime: new Date(Date.now() - 120_000).toISOString(),
			}),
		);

		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="right"
					onSaveSession={mockOnSaveSession}
				/>
			</TinyBaseTestWrapper>,
		);

		fireEvent.click(screen.getByText('Enter Time Manually'));

		expect(screen.getByText('Add Feeding Entry')).toBeInTheDocument();

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnSaveSession).toHaveBeenCalledTimes(1));
		const createdSession: FeedingSession = mockOnSaveSession.mock.calls[0][0];
		expect(createdSession.id).toBe(sessionId);
		expect(createdSession.breast).toBe('right');
	});

	it('returns to the start buttons when the session is ended on another device', () => {
		const store = createTestStore();
		store.setValue(
			STORE_VALUE_FEEDING_IN_PROGRESS,
			JSON.stringify({
				breast: 'left',
				id: 'session-ended-elsewhere',
				startTime: new Date(Date.now() - 60_000).toISOString(),
			}),
		);

		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onSaveSession={mockOnSaveSession}
				/>
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByText('End Feeding')).toBeInTheDocument();

		act(() => {
			store.delValue(STORE_VALUE_FEEDING_IN_PROGRESS);
		});

		expect(screen.queryByText('End Feeding')).not.toBeInTheDocument();
		expect(screen.getByText('Left Breast')).toBeInTheDocument();
		expect(mockOnSaveSession).not.toHaveBeenCalled();
	});

	it('keeps the original session id when resuming', () => {
		const store = createTestStore();
		const resumableSession: FeedingSession = {
			breast: 'left',
			durationInSeconds: 300,
			endTime: new Date(Date.now() - 300_000).toISOString(),
			id: 'resumable-id-1',
			startTime: new Date(Date.now() - 600_000).toISOString(),
		};

		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onSaveSession={mockOnSaveSession}
					resumableSession={resumableSession}
				/>
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByText('Resume')).toBeInTheDocument();

		fireEvent.click(screen.getByText('Left Breast'));

		const rawVal = store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS) as string;
		expect(JSON.parse(rawVal).id).toBe('resumable-id-1');

		fireEvent.click(screen.getByText('End Feeding'));

		expect(mockOnSaveSession).toHaveBeenCalledTimes(1);
		const updatedSession: FeedingSession = mockOnSaveSession.mock.calls[0][0];
		expect(updatedSession.id).toBe('resumable-id-1');
	});

	it('renders active right breast session, handles timer updates, and closes manual entry modal on close', () => {
		const store = createTestStore();
		const resumableRightSession: FeedingSession = {
			breast: 'right',
			durationInSeconds: 120,
			endTime: new Date().toISOString(),
			id: 'resumable-right-id',
			startTime: new Date().toISOString(),
		};

		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onSaveSession={mockOnSaveSession}
					resumableSession={resumableRightSession}
				/>
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByText('Resume')).toBeInTheDocument();

		// Click Right Breast button which triggers resumeFeeding for right breast
		fireEvent.click(screen.getByText('Right Breast'));

		expect(screen.getByText('Right Breast')).toBeInTheDocument();

		// Open manual session entry modal
		fireEvent.click(screen.getByText('Enter Time Manually'));
		expect(screen.getByText('Add Feeding Entry')).toBeInTheDocument();

		// Close manual session entry modal via onClose (Cancel button in FeedingForm)
		const cancelButton = screen.getByText('Cancel');
		fireEvent.click(cancelButton);

		expect(screen.queryByText('Add Feeding Entry')).not.toBeInTheDocument();
	});
});
