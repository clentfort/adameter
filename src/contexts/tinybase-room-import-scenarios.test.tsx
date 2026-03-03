import type { Changes, Content, Store } from 'tinybase';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { useContext } from 'react';
import { createStore } from 'tinybase';
import { useStore, useTable } from 'tinybase/ui-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { TinybaseProvider } from './tinybase-context';

const ROOM_JOIN_STRATEGY_STORAGE_KEY = 'room-join-strategy';

const mocks = vi.hoisted(() => ({
	createIndexedDbPersister: vi.fn(),
	createSecurePartyKitPersister: vi.fn(),
	getEncryptionKey: vi.fn(),
	hashRoomId: vi.fn(),
	runMigrationsIfNeeded: vi.fn(),
}));

vi.mock('partysocket', () => ({
	default: class MockPartySocket {
		addEventListener() {}
		removeEventListener() {}
		reconnect() {}
	},
}));

vi.mock('tinybase/persisters/persister-indexed-db', () => ({
	createIndexedDbPersister: mocks.createIndexedDbPersister,
}));

vi.mock('tinybase-persister-partykit-client-encrypted', () => ({
	createSecurePartyKitPersister: mocks.createSecurePartyKitPersister,
	getEncryptionKey: mocks.getEncryptionKey,
	hashRoomId: mocks.hashRoomId,
}));

vi.mock('@/migrations/run-if-needed', () => ({
	runMigrationsIfNeeded: mocks.runMigrationsIfNeeded,
}));

interface RemotePersisterMock {
	destroy: () => Promise<void>;
	hasLoadedPersistedData: () => boolean;
	hasSavedFullContent: () => boolean;
	load: () => Promise<void>;
	save: (changes?: Changes) => Promise<void>;
	startAutoLoad: () => Promise<void>;
	startAutoSave: () => Promise<void>;
	stopAutoLoad: () => Promise<void>;
	stopAutoSave: () => Promise<void>;
}

function expectEventCount(count: number) {
	expect(screen.getByTestId('event-count').textContent).toBe(String(count));
}

function buildEventRow(index: number, prefix: string) {
	return {
		deviceId: `${prefix}-device`,
		startDate: `2026-03-03T00:${String(index % 60).padStart(2, '0')}:00.000Z`,
		title: `${prefix}-${index}`,
		type: 'point',
	};
}

function seedEvents(store: Store, count: number, prefix: string) {
	for (let index = 0; index < count; index++) {
		store.setRow(
			TABLE_IDS.EVENTS,
			`${prefix}-${index}`,
			buildEventRow(index, prefix),
		);
	}
}

function hasAnyChanges(changes: Changes) {
	const [tableChanges, valueChanges] = changes;
	return (
		Object.keys(tableChanges).length > 0 || Object.keys(valueChanges).length > 0
	);
}

function cloneContent(content: Content): Content {
	return structuredClone(content);
}

function RoomSyncProbe({ importCount }: { importCount: number }) {
	const store = useStore()!;
	const events = useTable(TABLE_IDS.EVENTS, store);
	const { joinRoom } = useContext(DataSynchronizationContext);
	const eventCount = events ? Object.keys(events).length : 0;

	return (
		<div>
			<button onClick={() => joinRoom('scenario-room', 'merge')} type="button">
				Connect room
			</button>
			<button
				onClick={() => {
					seedEvents(store, importCount, 'imported');
				}}
				type="button"
			>
				Import data
			</button>
			<button
				onClick={() => {
					store.setRow(TABLE_IDS.EVENTS, `after-import-${eventCount}`, {
						deviceId: 'local-device',
						startDate: '2026-03-03T12:00:00.000Z',
						title: `after-import-${eventCount}`,
						type: 'point',
					});
				}}
				type="button"
			>
				Add one entry
			</button>
			<span data-testid="event-count">{eventCount}</span>
		</div>
	);
}

interface HarnessOptions {
	initialLoadFailures?: number;
	localCount: number;
	remoteCount: number;
}

function setupSyncHarness({
	initialLoadFailures = 0,
	localCount,
	remoteCount,
}: HarnessOptions) {
	const remoteStore = createStore();
	remoteStore.setContent([{}, {}]);
	seedEvents(remoteStore, remoteCount, 'remote-imported');

	mocks.createIndexedDbPersister.mockImplementation((store: Store) => ({
		destroy: vi.fn(async () => {}),
		load: vi.fn(async () => {
			store.setContent([{}, {}]);
			seedEvents(store, localCount, 'local-imported');
		}),
		startAutoSave: vi.fn(async () => {}),
		stopAutoSave: vi.fn(async () => {}),
	}));

	let loadAttempts = 0;
	let hasLoadedPersistedData = false;
	let hasSavedFullContent = false;

	mocks.createSecurePartyKitPersister.mockImplementation(
		(store: Store): RemotePersisterMock => {
			let autoSaveListenerId: string | undefined;

			const remotePersister: RemotePersisterMock = {
				destroy: vi.fn(async () => {}),
				hasLoadedPersistedData: vi.fn(() => hasLoadedPersistedData),
				hasSavedFullContent: vi.fn(() => hasSavedFullContent),
				load: vi.fn(async () => {
					loadAttempts += 1;
					if (loadAttempts <= initialLoadFailures) {
						return;
					}

					hasLoadedPersistedData = true;
					store.setContent(cloneContent(remoteStore.getContent()));
				}),
				save: vi.fn(async (changes?: Changes) => {
					if (changes) {
						remoteStore.applyChanges(changes);
						return;
					}

					if (!hasLoadedPersistedData) {
						return;
					}

					remoteStore.setContent(cloneContent(store.getContent()));
					hasSavedFullContent = true;
				}),
				startAutoLoad: vi.fn(async () => {
					await remotePersister.load();
				}),
				startAutoSave: vi.fn(async () => {
					await remotePersister.save();
					autoSaveListenerId = store.addDidFinishTransactionListener(() => {
						const changes = store.getTransactionChanges();
						if (hasAnyChanges(changes)) {
							void remotePersister.save(changes);
						}
					});
				}),
				stopAutoLoad: vi.fn(async () => {}),
				stopAutoSave: vi.fn(async () => {
					if (autoSaveListenerId !== undefined) {
						store.delListener(autoSaveListenerId);
						autoSaveListenerId = undefined;
					}
				}),
			};

			return remotePersister;
		},
	);

	return {
		getRemoteCount: () => remoteStore.getRowCount(TABLE_IDS.EVENTS),
	};
}

describe('room sync scenarios for imported data', () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		localStorage.clear();
		mocks.createSecurePartyKitPersister.mockReset();
		mocks.createIndexedDbPersister.mockReset();
		mocks.getEncryptionKey.mockReset();
		mocks.hashRoomId.mockReset();
		mocks.runMigrationsIfNeeded.mockReset();

		mocks.getEncryptionKey.mockResolvedValue({} as CryptoKey);
		mocks.hashRoomId.mockResolvedValue('hashed-scenario-room');
		mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });
	});

	it.each([10, 250, 1500])(
		'a) import data, then create room keeps %i rows',
		async (size) => {
			const harness = setupSyncHarness({
				initialLoadFailures: 1,
				localCount: size,
				remoteCount: 0,
			});

			render(
				<DataSynchronizationProvider>
					<TinybaseProvider>
						<RoomSyncProbe importCount={size} />
					</TinybaseProvider>
				</DataSynchronizationProvider>,
			);

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

			render(
				<DataSynchronizationProvider>
					<TinybaseProvider>
						<RoomSyncProbe importCount={size} />
					</TinybaseProvider>
				</DataSynchronizationProvider>,
			);

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

			render(
				<DataSynchronizationProvider>
					<TinybaseProvider>
						<RoomSyncProbe importCount={size} />
					</TinybaseProvider>
				</DataSynchronizationProvider>,
			);

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

			render(
				<DataSynchronizationProvider>
					<TinybaseProvider>
						<RoomSyncProbe importCount={size} />
					</TinybaseProvider>
				</DataSynchronizationProvider>,
			);

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

interface LocalSeed {
	count: number;
	prefix: string;
}

function setupMultiDeviceHarness(localSeeds: LocalSeed[]) {
	const remoteStore = createStore();
	remoteStore.setContent([{}, {}]);

	const seedsQueue = [...localSeeds];

	mocks.createIndexedDbPersister.mockImplementation((store: Store) => ({
		destroy: vi.fn(async () => {}),
		load: vi.fn(async () => {
			store.setContent([{}, {}]);
			const nextSeed = seedsQueue.shift() ?? { count: 0, prefix: 'empty-seed' };
			seedEvents(store, nextSeed.count, nextSeed.prefix);
		}),
		startAutoSave: vi.fn(async () => {}),
		stopAutoSave: vi.fn(async () => {}),
	}));

	mocks.createSecurePartyKitPersister.mockImplementation(
		(store: Store): RemotePersisterMock => {
			let autoSaveListenerId: string | undefined;
			let hasLoadedPersistedData = false;
			let hasSavedFullContent = false;

			const remotePersister: RemotePersisterMock = {
				destroy: vi.fn(async () => {}),
				hasLoadedPersistedData: vi.fn(() => hasLoadedPersistedData),
				hasSavedFullContent: vi.fn(() => hasSavedFullContent),
				load: vi.fn(async () => {
					hasLoadedPersistedData = true;
					store.setContent(cloneContent(remoteStore.getContent()));
				}),
				save: vi.fn(async (changes?: Changes) => {
					if (changes) {
						remoteStore.applyChanges(changes);
						return;
					}

					if (!hasLoadedPersistedData) {
						return;
					}

					remoteStore.setContent(cloneContent(store.getContent()));
					hasSavedFullContent = true;
				}),
				startAutoLoad: vi.fn(async () => {
					await remotePersister.load();
				}),
				startAutoSave: vi.fn(async () => {
					await remotePersister.save();
					autoSaveListenerId = store.addDidFinishTransactionListener(() => {
						const changes = store.getTransactionChanges();
						if (hasAnyChanges(changes)) {
							void remotePersister.save(changes);
						}
					});
				}),
				stopAutoLoad: vi.fn(async () => {}),
				stopAutoSave: vi.fn(async () => {
					if (autoSaveListenerId !== undefined) {
						store.delListener(autoSaveListenerId);
						autoSaveListenerId = undefined;
					}
				}),
			};

			return remotePersister;
		},
	);

	return {
		getRemoteCount: () => remoteStore.getRowCount(TABLE_IDS.EVENTS),
	};
}

async function runDeviceSession({
	autoConnect = false,
	expectedAfterConnect,
	expectedAfterImport,
	expectedInitial,
	importCount = 0,
	refreshAfterConnect = false,
	shouldAddOneEntry = false,
	shouldImportData = false,
}: {
	autoConnect?: boolean;
	expectedAfterConnect: number;
	expectedAfterImport?: number;
	expectedInitial?: number;
	importCount?: number;
	refreshAfterConnect?: boolean;
	shouldAddOneEntry?: boolean;
	shouldImportData?: boolean;
}) {
	render(
		<DataSynchronizationProvider>
			<TinybaseProvider>
				<RoomSyncProbe importCount={importCount} />
			</TinybaseProvider>
		</DataSynchronizationProvider>,
	);

	if (expectedInitial !== undefined) {
		await waitFor(() => {
			expectEventCount(expectedInitial);
		});
	}

	if (!autoConnect) {
		fireEvent.click(screen.getByRole('button', { name: 'Connect room' }));
	}

	await waitFor(() => {
		expectEventCount(expectedAfterConnect);
	});

	if (shouldImportData) {
		fireEvent.click(screen.getByRole('button', { name: 'Import data' }));
		await waitFor(() => {
			expectEventCount(
				expectedAfterImport ?? expectedAfterConnect + importCount,
			);
		});
	}

	if (shouldAddOneEntry) {
		fireEvent.click(screen.getByRole('button', { name: 'Add one entry' }));
		await waitFor(() => {
			expectEventCount(expectedAfterConnect + 1);
		});
	}

	const expectedAfterImportOrConnect = shouldImportData
		? (expectedAfterImport ?? expectedAfterConnect + importCount)
		: expectedAfterConnect;
	const expectedAfterActions = shouldAddOneEntry
		? expectedAfterImportOrConnect + 1
		: expectedAfterImportOrConnect;

	if (refreshAfterConnect) {
		document.dispatchEvent(new Event('visibilitychange'));
		window.dispatchEvent(new Event('focus'));
		await waitFor(() => {
			expectEventCount(expectedAfterActions);
		});
	}

	cleanup();
}

describe('multi-device and stale session scenarios', () => {
	afterEach(() => {
		cleanup();
	});

	beforeEach(() => {
		localStorage.clear();
		mocks.createSecurePartyKitPersister.mockReset();
		mocks.createIndexedDbPersister.mockReset();
		mocks.getEncryptionKey.mockReset();
		mocks.hashRoomId.mockReset();
		mocks.runMigrationsIfNeeded.mockReset();

		mocks.getEncryptionKey.mockResolvedValue({} as CryptoKey);
		mocks.hashRoomId.mockResolvedValue('hashed-scenario-room');
		mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });
	});

	it('keeps data intact when three devices sync sequentially', async () => {
		const harness = setupMultiDeviceHarness([
			{ count: 1500, prefix: 'device-a-import' },
			{ count: 0, prefix: 'device-b-empty' },
			{ count: 0, prefix: 'device-c-empty' },
		]);

		await runDeviceSession({
			expectedAfterConnect: 1500,
			expectedInitial: 1500,
			shouldAddOneEntry: true,
		});

		localStorage.removeItem('room');
		await runDeviceSession({
			expectedAfterConnect: 1501,
			expectedInitial: 0,
			shouldAddOneEntry: true,
		});

		localStorage.setItem('room', 'scenario-room');
		await runDeviceSession({
			autoConnect: true,
			expectedAfterConnect: 1502,
			refreshAfterConnect: true,
		});

		expect(harness.getRemoteCount()).toBe(1502);
	});

	it('merges stale offline imports from a third device without wiping room', async () => {
		const harness = setupMultiDeviceHarness([
			{ count: 1000, prefix: 'device-a-import' },
			{ count: 0, prefix: 'device-b-empty' },
			{ count: 120, prefix: 'device-c-offline-import' },
		]);

		await runDeviceSession({
			expectedAfterConnect: 1000,
			expectedInitial: 1000,
			shouldAddOneEntry: true,
		});

		localStorage.removeItem('room');
		await runDeviceSession({
			expectedAfterConnect: 1001,
			expectedInitial: 0,
		});

		localStorage.removeItem('room');
		await runDeviceSession({
			expectedAfterConnect: 1121,
			expectedInitial: 120,
			refreshAfterConnect: true,
		});

		expect(harness.getRemoteCount()).toBe(1121);
	});

	it('keeps imported in-room data after reload', async () => {
		const harness = setupMultiDeviceHarness([
			{ count: 0, prefix: 'device-a-empty' },
			{ count: 500, prefix: 'imported' },
		]);

		await runDeviceSession({
			expectedAfterConnect: 0,
			expectedInitial: 0,
			importCount: 500,
			refreshAfterConnect: true,
			shouldImportData: true,
		});

		expect(harness.getRemoteCount()).toBe(500);

		await runDeviceSession({
			autoConnect: true,
			expectedAfterConnect: 500,
			expectedInitial: 500,
			refreshAfterConnect: true,
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

		render(
			<DataSynchronizationProvider>
				<TinybaseProvider>
					<RoomSyncProbe importCount={0} />
				</TinybaseProvider>
			</DataSynchronizationProvider>,
		);

		await waitFor(() => {
			expectEventCount(1501);
			expect(harness.getRemoteCount()).toBe(1501);
		});

		document.dispatchEvent(new Event('visibilitychange'));
		window.dispatchEvent(new Event('focus'));

		await waitFor(() => {
			expectEventCount(1501);
			expect(harness.getRemoteCount()).toBe(1501);
		});
	});
});
