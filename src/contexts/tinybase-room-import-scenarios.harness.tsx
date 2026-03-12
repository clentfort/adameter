import type { Store } from 'tinybase';
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
import { expect, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { TinybaseProvider } from './tinybase-context';

export const ROOM_JOIN_STRATEGY_STORAGE_KEY = 'room-join-strategy';

const mocks = vi.hoisted(() => ({
	createEncryptedPartyKitSynchronizer: vi.fn(),
	createIndexedDbPersister: vi.fn(),
	getEncryptionKey: vi.fn(),
	getStoreUrl: vi.fn(),
	hashRoomId: vi.fn(),
	loadServerSnapshot: vi.fn(),
	runMigrationsIfNeeded: vi.fn(),
	saveServerSnapshot: vi.fn(),
}));

vi.mock('partysocket', () => ({
	default: class MockPartySocket {
		partySocketOptions = { host: 'localhost:1999', room: 'test-room' };
		name = 'tinybase';
		readyState = 1; // WebSocket.OPEN
		addEventListener() {}
		close() {}
		removeEventListener() {}
		send() {}
	},
}));

vi.mock('tinybase/persisters/persister-indexed-db', () => ({
	createIndexedDbPersister: mocks.createIndexedDbPersister,
}));

vi.mock('tinybase-synchronizer-partykit-client-encrypted', () => ({
	createEncryptedPartyKitSynchronizer:
		mocks.createEncryptedPartyKitSynchronizer,
	getEncryptionKey: mocks.getEncryptionKey,
	getStoreUrl: mocks.getStoreUrl,
	hashRoomId: mocks.hashRoomId,
	loadServerSnapshot: mocks.loadServerSnapshot,
	saveServerSnapshot: mocks.saveServerSnapshot,
}));

vi.mock('@/migrations/run-if-needed', () => ({
	runMigrationsIfNeeded: mocks.runMigrationsIfNeeded,
}));

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

function seedEvents(store: Store, count: number, prefix: string) {
	for (let index = 0; index < count; index++) {
		store.setRow(
			TABLE_IDS.EVENTS,
			`${prefix}-${index}`,
			buildEventRow(index, prefix),
		);
	}
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
	mocks.createEncryptedPartyKitSynchronizer.mockReset();
	mocks.createIndexedDbPersister.mockReset();
	mocks.getEncryptionKey.mockReset();
	mocks.getStoreUrl.mockReset();
	mocks.hashRoomId.mockReset();
	mocks.loadServerSnapshot.mockReset();
	mocks.runMigrationsIfNeeded.mockReset();
	mocks.saveServerSnapshot.mockReset();

	mocks.getEncryptionKey.mockResolvedValue({} as CryptoKey);
	mocks.hashRoomId.mockResolvedValue('hashed-scenario-room');
	mocks.getStoreUrl.mockReturnValue(
		'http://localhost:1999/parties/tinybase/hashed-scenario-room/store',
	);
	mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });

	mocks.createEncryptedPartyKitSynchronizer.mockResolvedValue({
		destroy: vi.fn(async () => {}),
		startSync: vi.fn(async () => {}),
	});
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

export function setupSyncHarness({
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

	// loadServerSnapshot merges remote data into local store (CRDT merge)
	mocks.loadServerSnapshot.mockImplementation((store: Store) => {
		loadAttempts += 1;
		if (loadAttempts <= initialLoadFailures) {
			return Promise.resolve(false);
		}

		// Simulate CRDT merge: add remote rows without replacing local ones
		const remoteEvents = remoteStore.getTable(TABLE_IDS.EVENTS);
		if (remoteEvents) {
			for (const [rowId, row] of Object.entries(remoteEvents)) {
				store.setRow(TABLE_IDS.EVENTS, rowId, row);
			}
		}
		return Promise.resolve(remoteCount > 0);
	});

	// saveServerSnapshot captures current store state to remoteStore.
	// We keep a weak reference to the store so flushSnapshot() can
	// capture the final state before a session is torn down.
	let lastStore: Store | undefined;
	mocks.saveServerSnapshot.mockImplementation((store: Store) => {
		lastStore = store;
		remoteStore.setContent(structuredClone(store.getContent()));
		return Promise.resolve();
	});

	return {
		flushSnapshot: () => {
			if (lastStore) {
				remoteStore.setContent(structuredClone(lastStore.getContent()));
				lastStore = undefined;
			}
		},
		getRemoteCount: () => remoteStore.getRowCount(TABLE_IDS.EVENTS),
	};
}

export function setupMultiDeviceHarness(localSeeds: LocalSeed[]) {
	const remoteStore = createStore();
	remoteStore.setContent([{}, {}]);

	const seedsQueue = [...localSeeds];

	mocks.createIndexedDbPersister.mockImplementation((store: Store) => ({
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
	}));

	// loadServerSnapshot merges remote data into local store
	mocks.loadServerSnapshot.mockImplementation((store: Store) => {
		const remoteEvents = remoteStore.getTable(TABLE_IDS.EVENTS);
		const hasData =
			remoteEvents != null && Object.keys(remoteEvents).length > 0;
		if (hasData) {
			for (const [rowId, row] of Object.entries(remoteEvents!)) {
				store.setRow(TABLE_IDS.EVENTS, rowId, row);
			}
		}
		return Promise.resolve(hasData);
	});

	// saveServerSnapshot captures current store state.
	let lastStore: Store | undefined;
	mocks.saveServerSnapshot.mockImplementation((store: Store) => {
		lastStore = store;
		remoteStore.setContent(structuredClone(store.getContent()));
		return Promise.resolve();
	});

	return {
		flushSnapshot: () => {
			if (lastStore) {
				remoteStore.setContent(structuredClone(lastStore.getContent()));
				lastStore = undefined;
			}
		},
		getRemoteCount: () => remoteStore.getRowCount(TABLE_IDS.EVENTS),
	};
}

export async function runDeviceSession({
	autoConnect = false,
	expectedAfterConnect,
	expectedAfterImport,
	expectedInitial,
	flushSnapshot,
	importCount = 0,
	shouldAddOneEntry = false,
	shouldImportData = false,
}: {
	autoConnect?: boolean;
	expectedAfterConnect: number;
	expectedAfterImport?: number;
	expectedInitial?: number;
	flushSnapshot?: () => void;
	importCount?: number;
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

	// Flush the snapshot before cleanup so the remote store has the
	// final state (simulates the periodic snapshot save firing).
	flushSnapshot?.();
	cleanup();
}
