import type { MergeableStore } from 'tinybase';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { useContext } from 'react';
import { createMergeableStore } from 'tinybase';
import { useStore, useTable } from 'tinybase/ui-react';
import { expect, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { TinybaseProvider } from './tinybase-context';

export const ROOM_JOIN_STRATEGY_STORAGE_KEY = 'room-join-strategy';

const mocks = vi.hoisted(() => ({
	createIndexedDbPersister: vi.fn(),
	createMergeableIndexedDbPersister: vi.fn(),
	createSecurePartyKitPersister: vi.fn(),
	createSecurePartyKitSynchronizer: vi.fn(),
	getEncryptionKey: vi.fn(),
	hashRoomId: vi.fn(),
	runMigrationsIfNeeded: vi.fn(),
}));

vi.mock('partysocket', () => ({
	default: class MockPartySocket {
		addEventListener() {}
		removeEventListener() {}
		reconnect() {}
		close() {}
	},
}));

vi.mock('tinybase/persisters/persister-indexed-db', () => ({
	createIndexedDbPersister: mocks.createIndexedDbPersister,
}));

vi.mock('@/lib/tinybase-sync/indexed-db-mergeable', () => ({
	createMergeableIndexedDbPersister: mocks.createMergeableIndexedDbPersister,
}));

vi.mock('tinybase-persister-partykit-client-encrypted', () => ({
	createSecurePartyKitPersister: mocks.createSecurePartyKitPersister,
	getEncryptionKey: mocks.getEncryptionKey,
	hashRoomId: mocks.hashRoomId,
}));

vi.mock('tinybase-synchronizer-partykit-client-encrypted', () => ({
	createSecurePartyKitSynchronizer: mocks.createSecurePartyKitSynchronizer,
}));

vi.mock('@/migrations/run-if-needed', () => ({
	runMigrationsIfNeeded: mocks.runMigrationsIfNeeded,
}));

interface RemotePersisterMock {
	destroy: () => Promise<void>;
	load: () => Promise<void>;
	save: () => Promise<void>;
	startAutoSave: () => Promise<void>;
	stopAutoSave: () => Promise<void>;
}

interface RemoteSynchronizerMock {
	destroy: () => Promise<void>;
	startSync: () => Promise<void>;
	stopSync: () => Promise<void>;
}

interface HarnessOptions {
	initialLoadFailures?: number;
	localCount: number;
	remoteCount: number;
}

interface LocalSeed {
	count: number;
	prefix: string;
}

function buildEventRow(index: number, prefix: string) {
	return {
		deviceId: `${prefix}-device`,
		startDate: `2026-03-03T00:${String(index % 60).padStart(2, '0')}:00.000Z`,
		title: `${prefix}-${index}`,
		type: 'point',
	};
}

function seedEvents(store: MergeableStore, count: number, prefix: string) {
	store.transaction(() => {
		for (let index = 0; index < count; index++) {
			store.setRow(
				TABLE_IDS.EVENTS,
				`${prefix}-${index}`,
				buildEventRow(index, prefix),
			);
		}
	});
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

export function resetRoomImportScenarioMocks() {
	localStorage.clear();
	mocks.createSecurePartyKitSynchronizer.mockReset();
	mocks.createSecurePartyKitPersister.mockReset();
	mocks.createMergeableIndexedDbPersister.mockReset();
	mocks.createIndexedDbPersister.mockReset();
	mocks.getEncryptionKey.mockReset();
	mocks.hashRoomId.mockReset();
	mocks.runMigrationsIfNeeded.mockReset();

	mocks.getEncryptionKey.mockResolvedValue({} as CryptoKey);
	mocks.hashRoomId.mockResolvedValue('hashed-scenario-room');
	mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });

	mocks.createIndexedDbPersister.mockImplementation(() => ({
		destroy: vi.fn(async () => {}),
		load: vi.fn(async () => {}),
	}));
}

export function expectEventCount(count: number) {
	expect(screen.getByTestId('event-count').textContent).toBe(String(count));
}

export function renderRoomSyncProbe(importCount: number) {
	return render(
		<DataSynchronizationProvider>
			<TinybaseProvider>
				<RoomSyncProbe importCount={importCount} />
			</TinybaseProvider>
		</DataSynchronizationProvider>,
	);
}

const activeSynchronizers: MergeableStore[] = [];

export function setupSyncHarness({
	initialLoadFailures = 0,
	localCount,
	remoteCount,
}: HarnessOptions) {
	const serverStore = createMergeableStore('server');
	seedEvents(serverStore, remoteCount, 'remote-imported');

	mocks.createMergeableIndexedDbPersister.mockImplementation(
		(store: MergeableStore) => ({
			destroy: vi.fn(async () => {}),
			load: vi.fn(async () => {
				store.setContent([{}, {}]);
				seedEvents(store, localCount, 'local-imported');
			}),
			startAutoSave: vi.fn(async () => {}),
			stopAutoSave: vi.fn(async () => {}),
		}),
	);

	let loadAttempts = 0;

	mocks.createSecurePartyKitPersister.mockImplementation(
		(store: MergeableStore): RemotePersisterMock => {
			const remotePersister: RemotePersisterMock = {
				destroy: vi.fn(async () => {}),
				load: vi.fn(async () => {
					loadAttempts += 1;
					if (loadAttempts <= initialLoadFailures) {
						throw new Error('Load failed');
					}
					store.merge(serverStore);
				}),
				save: vi.fn(async () => {
					serverStore.merge(store);
				}),
				startAutoSave: vi.fn(async () => {
					await remotePersister.save();
					store.addDidFinishTransactionListener(() => {
						void remotePersister.save();
					});
				}),
				stopAutoSave: vi.fn(async () => {}),
			};

			return remotePersister;
		},
	);

	mocks.createSecurePartyKitSynchronizer.mockImplementation(
		(store: MergeableStore): RemoteSynchronizerMock => {
			const synchronizer: RemoteSynchronizerMock = {
				destroy: vi.fn(async () => {
					const idx = activeSynchronizers.indexOf(store);
					if (idx !== -1) activeSynchronizers.splice(idx, 1);
				}),
				startSync: vi.fn(async () => {
					activeSynchronizers.push(store);
					// Simulate P2P sync by merging with other active stores
					for (const otherStore of activeSynchronizers) {
						if (otherStore !== store) {
							store.merge(otherStore);
							otherStore.merge(store);
						}
					}
				}),
				stopSync: vi.fn(async () => {
					const idx = activeSynchronizers.indexOf(store);
					if (idx !== -1) activeSynchronizers.splice(idx, 1);
				}),
			};
			return synchronizer;
		},
	);

	return {
		getRemoteCount: () => serverStore.getRowCount(TABLE_IDS.EVENTS),
	};
}

export function setupMultiDeviceHarness(localSeeds: LocalSeed[]) {
	const serverStore = createMergeableStore('server');
	const seedsQueue = [...localSeeds];

	mocks.createMergeableIndexedDbPersister.mockImplementation(
		(store: MergeableStore) => ({
			destroy: vi.fn(async () => {}),
			load: vi.fn(async () => {
				store.setContent([{}, {}]);
				const nextSeed = seedsQueue.shift() ?? {
					count: 0,
					prefix: 'empty-seed',
				};
				seedEvents(store, nextSeed.count, nextSeed.prefix);
			}),
			startAutoSave: vi.fn(async () => {}),
			stopAutoSave: vi.fn(async () => {}),
		}),
	);

	mocks.createSecurePartyKitPersister.mockImplementation(
		(store: MergeableStore): RemotePersisterMock => {
			const remotePersister: RemotePersisterMock = {
				destroy: vi.fn(async () => {}),
				load: vi.fn(async () => {
					store.merge(serverStore);
				}),
				save: vi.fn(async () => {
					serverStore.merge(store);
				}),
				startAutoSave: vi.fn(async () => {
					await remotePersister.save();
					store.addDidFinishTransactionListener(() => {
						void remotePersister.save();
					});
				}),
				stopAutoSave: vi.fn(async () => {}),
			};

			return remotePersister;
		},
	);

	mocks.createSecurePartyKitSynchronizer.mockImplementation(
		(store: MergeableStore): RemoteSynchronizerMock => {
			const synchronizer: RemoteSynchronizerMock = {
				destroy: vi.fn(async () => {
					const idx = activeSynchronizers.indexOf(store);
					if (idx !== -1) activeSynchronizers.splice(idx, 1);
				}),
				startSync: vi.fn(async () => {
					activeSynchronizers.push(store);
					for (const otherStore of activeSynchronizers) {
						if (otherStore !== store) {
							store.merge(otherStore);
							otherStore.merge(store);
						}
					}
				}),
				stopSync: vi.fn(async () => {
					const idx = activeSynchronizers.indexOf(store);
					if (idx !== -1) activeSynchronizers.splice(idx, 1);
				}),
			};
			return synchronizer;
		},
	);

	return {
		getRemoteCount: () => serverStore.getRowCount(TABLE_IDS.EVENTS),
	};
}

export async function runDeviceSession({
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
	renderRoomSyncProbe(importCount);

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
	}, { timeout: 5000 });

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
