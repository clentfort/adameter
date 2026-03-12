import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	expectEventCount,
	renderRoomSyncProbe,
	resetRoomImportScenarioMocks,
	ROOM_JOIN_STRATEGY_STORAGE_KEY,
	runDeviceSession,
	setupMultiDeviceHarness,
	setupSyncHarness,
} from './tinybase-room-import-scenarios.harness';

describe('multi-device and stale session scenarios', () => {
	beforeEach(() => {
		resetRoomImportScenarioMocks();
	});

	it('keeps data intact when three devices sync sequentially', async () => {
		const harness = setupMultiDeviceHarness([
			{ count: 1500, prefix: 'device-a-import' },
			{ count: 0, prefix: 'device-b-empty' },
			{ count: 0, prefix: 'device-c-empty' },
		]);

		// Device A: loads 1500 local events, joins room, adds one
		await runDeviceSession({
			expectedAfterConnect: 1500,
			expectedInitial: 1500,
			flushSnapshot: harness.flushSnapshot,
			shouldAddOneEntry: true,
		});

		// Device B: no local data, joins room → gets 1501 from server, adds one
		localStorage.removeItem('room');
		await runDeviceSession({
			expectedAfterConnect: 1501,
			expectedInitial: 0,
			flushSnapshot: harness.flushSnapshot,
			shouldAddOneEntry: true,
		});

		// Device C: auto-rejoin → gets 1502 from server
		localStorage.setItem('room', 'scenario-room');
		await runDeviceSession({
			autoConnect: true,
			expectedAfterConnect: 1502,
			flushSnapshot: harness.flushSnapshot,
		});

		expect(harness.getRemoteCount()).toBe(1502);
	});

	it('merges stale offline imports from a third device without wiping room', async () => {
		const harness = setupMultiDeviceHarness([
			{ count: 1000, prefix: 'device-a-import' },
			{ count: 0, prefix: 'device-b-empty' },
			{ count: 120, prefix: 'device-c-offline-import' },
		]);

		// Device A: loads 1000, joins room, adds one
		await runDeviceSession({
			expectedAfterConnect: 1000,
			expectedInitial: 1000,
			flushSnapshot: harness.flushSnapshot,
			shouldAddOneEntry: true,
		});

		// Device B: no local data, joins room → gets 1001
		localStorage.removeItem('room');
		await runDeviceSession({
			expectedAfterConnect: 1001,
			expectedInitial: 0,
			flushSnapshot: harness.flushSnapshot,
		});

		// Device C: has 120 offline imports, joins room → merges to 1121
		localStorage.removeItem('room');
		await runDeviceSession({
			expectedAfterConnect: 1121,
			expectedInitial: 120,
			flushSnapshot: harness.flushSnapshot,
		});

		expect(harness.getRemoteCount()).toBe(1121);
	});

	it('keeps imported in-room data after reload', async () => {
		const harness = setupMultiDeviceHarness([
			{ count: 0, prefix: 'device-a-empty' },
			{ count: 500, prefix: 'imported' },
		]);

		// First session: join room, import 500 rows
		await runDeviceSession({
			expectedAfterConnect: 0,
			expectedInitial: 0,
			flushSnapshot: harness.flushSnapshot,
			importCount: 500,
			shouldImportData: true,
		});

		expect(harness.getRemoteCount()).toBe(500);

		// Second session: reload with room set → data comes back from server
		await runDeviceSession({
			autoConnect: true,
			expectedAfterConnect: 500,
			expectedInitial: 500,
			flushSnapshot: harness.flushSnapshot,
		});

		expect(harness.getRemoteCount()).toBe(500);
	});

	it('auto-rejoin falls back to merge when stored strategy is missing', async () => {
		const harness = setupSyncHarness({
			localCount: 1500,
			remoteCount: 1,
		});

		localStorage.setItem('room', 'scenario-room');
		localStorage.removeItem(ROOM_JOIN_STRATEGY_STORAGE_KEY);

		renderRoomSyncProbe(0);

		await waitFor(() => {
			expectEventCount(1501);
		});

		expect(harness.getRemoteCount()).toBe(1501);
	});
});
