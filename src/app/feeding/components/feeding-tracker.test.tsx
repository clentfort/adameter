import type { FeedingSession } from '@/types/feeding';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	STORE_VALUE_FEEDING_IN_PROGRESS,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import BreastfeedingTracker from './feeding-tracker';

describe('BreastfeedingTracker', () => {
	const mockOnCreateSession = vi.fn();
	const mockOnUpdateSession = vi.fn();

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
					onCreateSession={mockOnCreateSession}
					onUpdateSession={mockOnUpdateSession}
				/>
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByText('Left Breast')).toBeInTheDocument();
		expect(screen.getByText('Right Breast')).toBeInTheDocument();
		expect(screen.getByText('Next')).toBeInTheDocument();
	});

	it('pre-generates UUID session ID and sets feedingInProgress when starting feeding', () => {
		const store = createTestStore();
		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onCreateSession={mockOnCreateSession}
					onUpdateSession={mockOnUpdateSession}
				/>
			</TinyBaseTestWrapper>,
		);

		fireEvent.click(screen.getByText('Left Breast'));

		const rawVal = store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS) as string;
		expect(rawVal).toBeDefined();

		const parsed = JSON.parse(rawVal);
		expect(parsed.breast).toBe('left');
		expect(parsed.id).toMatch(
			/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
		);
	});

	it('ends feeding session using the pre-generated ID', () => {
		const store = createTestStore();
		const pregenId = '12345678-1234-4234-8234-123456789abc';

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
					onCreateSession={mockOnCreateSession}
					onUpdateSession={mockOnUpdateSession}
				/>
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByText('End Feeding')).toBeInTheDocument();

		fireEvent.click(screen.getByText('End Feeding'));

		expect(mockOnCreateSession).toHaveBeenCalledTimes(1);
		const createdSession: FeedingSession = mockOnCreateSession.mock.calls[0][0];
		expect(createdSession.id).toBe(pregenId);
		expect(createdSession.breast).toBe('left');

		expect(store.hasValue(STORE_VALUE_FEEDING_IN_PROGRESS)).toBe(false);
	});

	it('prevents saving duplicate session when session is no longer running in store', () => {
		const store = createTestStore();
		const sessionId = 'session-ended-elsewhere';

		store.setValue(
			STORE_VALUE_FEEDING_IN_PROGRESS,
			JSON.stringify({
				breast: 'left',
				id: sessionId,
				startTime: new Date(Date.now() - 60_000).toISOString(),
			}),
		);

		render(
			<TinyBaseTestWrapper store={store}>
				<BreastfeedingTracker
					nextBreast="left"
					onCreateSession={mockOnCreateSession}
					onUpdateSession={mockOnUpdateSession}
				/>
			</TinyBaseTestWrapper>,
		);

		store.setRow(TABLE_IDS.FEEDING_SESSIONS, sessionId, {
			breast: 'left',
			durationInSeconds: 60,
			endTime: new Date().toISOString(),
			id: sessionId,
			startTime: new Date(Date.now() - 60_000).toISOString(),
		});
		store.delValue(STORE_VALUE_FEEDING_IN_PROGRESS);

		fireEvent.click(screen.getByText('End Feeding'));

		expect(mockOnCreateSession).not.toHaveBeenCalled();
	});

	it('opens manual save dialog when session is still running and allows saving', async () => {
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
					onCreateSession={mockOnCreateSession}
					onUpdateSession={mockOnUpdateSession}
				/>
			</TinyBaseTestWrapper>,
		);

		fireEvent.click(screen.getByText('Enter Time Manually'));

		expect(screen.getByText('Add Feeding Entry')).toBeInTheDocument();

		fireEvent.click(screen.getByTestId('save-button'));

		await waitFor(() => expect(mockOnCreateSession).toHaveBeenCalledTimes(1));
		const createdSession: FeedingSession = mockOnCreateSession.mock.calls[0][0];
		expect(createdSession.id).toBe(sessionId);
		expect(createdSession.breast).toBe('right');
	});

	it('prevents opening manual save dialog if session is no longer running in store', () => {
		const store = createTestStore();
		const sessionId = 'session-ended-elsewhere-manual';

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
					onCreateSession={mockOnCreateSession}
					onUpdateSession={mockOnUpdateSession}
				/>
			</TinyBaseTestWrapper>,
		);

		store.delValue(STORE_VALUE_FEEDING_IN_PROGRESS);

		fireEvent.click(screen.getByText('Enter Time Manually'));

		expect(screen.queryByText('Add Feeding Entry')).not.toBeInTheDocument();
		expect(mockOnCreateSession).not.toHaveBeenCalled();
	});

	it('allows resuming an existing session and updates it on end', () => {
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
					onCreateSession={mockOnCreateSession}
					onUpdateSession={mockOnUpdateSession}
					resumableSession={resumableSession}
				/>
			</TinyBaseTestWrapper>,
		);

		expect(screen.getByText('Resume')).toBeInTheDocument();

		fireEvent.click(screen.getByText('Left Breast'));

		const rawVal = store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS) as string;
		expect(JSON.parse(rawVal).id).toBe('resumable-id-1');

		fireEvent.click(screen.getByText('End Feeding'));

		expect(mockOnUpdateSession).toHaveBeenCalledTimes(1);
		const updatedSession: FeedingSession = mockOnUpdateSession.mock.calls[0][0];
		expect(updatedSession.id).toBe('resumable-id-1');
	});
});
