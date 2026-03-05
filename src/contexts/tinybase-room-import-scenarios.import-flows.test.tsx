import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	expectEventCount,
	renderRoomSyncProbe,
	resetRoomImportScenarioMocks,
	setupSyncHarness,
} from './tinybase-room-import-scenarios.harness';

describe('room sync scenarios for imported data', () => {
	beforeEach(() => {
		resetRoomImportScenarioMocks();
	});

	it.each([10, 250, 1500])(
		'a) import data, then create room keeps %i rows',
		async (size) => {
			const harness = setupSyncHarness({
				initialLoadFailures: 1,
				localCount: size,
				remoteCount: 0,
			});

			renderRoomSyncProbe(size);

			await waitFor(() => {
				expectEventCount(size);
			});

			fireEvent.click(screen.getByRole('button', { name: 'Connect room' }));

			await waitFor(() => {
				expectEventCount(size);
			});

			fireEvent.click(screen.getByRole('button', { name: 'Add one entry' }));

			await waitFor(() => {
				expectEventCount(size + 1);
			});

			document.dispatchEvent(new Event('visibilitychange'));
			window.dispatchEvent(new Event('focus'));

			await waitFor(() => {
				expectEventCount(size + 1);
				expect(harness.getRemoteCount()).toBe(size + 1);
			});
		},
	);

	it.each([10, 250, 1500])(
		'b) create room (empty), then import keeps %i rows',
		async (size) => {
			const harness = setupSyncHarness({
				localCount: 0,
				remoteCount: 0,
			});

			renderRoomSyncProbe(size);

			await waitFor(() => {
				expectEventCount(0);
			});

			fireEvent.click(screen.getByRole('button', { name: 'Connect room' }));

			await waitFor(() => {
				expectEventCount(0);
			});

			fireEvent.click(screen.getByRole('button', { name: 'Import data' }));

			await waitFor(() => {
				expectEventCount(size);
				expect(harness.getRemoteCount()).toBe(size);
			});

			document.dispatchEvent(new Event('visibilitychange'));
			window.dispatchEvent(new Event('focus'));

			await waitFor(() => {
				expectEventCount(size);
				expect(harness.getRemoteCount()).toBe(size);
			});
		},
	);

	it.each([10, 250, 1500])(
		'c) join room that already has imported data keeps %i rows',
		async (size) => {
			const harness = setupSyncHarness({
				localCount: 0,
				remoteCount: size,
			});

			renderRoomSyncProbe(size);

			await waitFor(() => {
				expectEventCount(0);
			});

			fireEvent.click(screen.getByRole('button', { name: 'Connect room' }));

			await waitFor(() => {
				expectEventCount(size);
				expect(harness.getRemoteCount()).toBe(size);
			});
		},
	);

	it.each([10, 250, 1500])(
		'd) join room with imported data merges local imported data for %i rows each side',
		async (size) => {
			const harness = setupSyncHarness({
				localCount: size,
				remoteCount: size,
			});

			renderRoomSyncProbe(size);

			await waitFor(() => {
				expectEventCount(size);
			});

			fireEvent.click(screen.getByRole('button', { name: 'Connect room' }));

			await waitFor(() => {
				expectEventCount(size * 2);
				expect(harness.getRemoteCount()).toBe(size * 2);
			});

			document.dispatchEvent(new Event('visibilitychange'));
			window.dispatchEvent(new Event('focus'));

			await waitFor(() => {
				expectEventCount(size * 2);
				expect(harness.getRemoteCount()).toBe(size * 2);
			});
		},
	);
});
