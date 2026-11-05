import type { MergeableContent, MergeableStore, Store } from 'tinybase';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { useContext } from 'react';
import 'fake-indexeddb/auto';
import { createMergeableStore } from 'tinybase';
import {
	createCellSync,
	createMemoryCellSyncStateStore,
	getCellKeys,
	hashRoomId,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { useStore, useTable } from 'tinybase/ui-react';
import { expect, vi } from 'vitest';
import { clear, removeItem, STORAGE_KEYS } from '@/lib/storage';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { installFakeCellRelay } from '@/test-utils/fake-cell-relay';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { TinybaseProvider } from './tinybase-context';

export const ROOM_JOIN_STRATEGY_STORAGE_KEY = 'room-join-strategy';

const mocks = vi.hoisted(() => ({
	createIndexedDbPersister: vi.fn(),
	runMigrationsIfNeeded: vi.fn(),
}));

vi.mock('partysocket', () => ({
	default: class MockPartySocket {
		addEventListener() {}
		close() {}
		removeEventListener() {}
	},
}));

vi.mock('tinybase/persisters/persister-indexed-db', () => ({
	createIndexedDbPersister: mocks.createIndexedDbPersister,
}));

vi.mock('@/migrations/run-if-needed', () => ({
	runMigrationsIfNeeded: mocks.runMigrationsIfNeeded,
}));

const ROOM_NAME = 'scenario-room';
const EMPTY_MERGEABLE_CONTENT: MergeableContent = [
	[{}, '', 0],
	[{}, '', 0],
];
let relay: ReturnType<typeof installFakeCellRelay>;

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
			<button onClick={() => joinRoom(ROOM_NAME, 'merge')} type="button">
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
	clear();
	mocks.createIndexedDbPersister.mockReset();
	mocks.runMigrationsIfNeeded.mockReset();
	mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });
	relay = installFakeCellRelay();
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

async function getRemoteCount(): Promise<number> {
	const store = await relay.getStore(ROOM_NAME, await hashRoomId(ROOM_NAME));
	return store.getRowCount(TABLE_IDS.EVENTS);
}

/** Uploads events to the room, as another device would. */
async function seedRemoteEvents(count: number) {
	if (count === 0) return;
	const store = createMergeableStore();
	seedEvents(store, count, 'remote-imported');
	const cellSync = createCellSync({
		cellsUrl: `http://localhost:1999/parties/tinybase/${await hashRoomId(ROOM_NAME)}/cells`,
		keys: await getCellKeys(ROOM_NAME),
		state: createMemoryCellSyncStateStore(),
		store,
	});
	await cellSync.init();
	await cellSync.push();
	await cellSync.dispose();
}

// The provider's store is a module singleton; other stores (e.g. the probe
// that re-reads a rejected database) must not consume a device's seed.
let appStore: MergeableStore | undefined;

function createPersisterMock(seed: (store: Store) => void) {
	return (store: MergeableStore) => ({
		destroy: vi.fn(async () => {}),
		load: vi.fn(async () => {
			appStore ??= store;
			if (store !== appStore) return;
			// Like a fresh page load. setContent would add deletions that sync.
			store.setMergeableContent(EMPTY_MERGEABLE_CONTENT);
			seed(store);
		}),
		save: vi.fn(async () => {}),
		startAutoSave: vi.fn(async () => {}),
		stopAutoSave: vi.fn(async () => {}),
	});
}

export async function setupSyncHarness({
	initialLoadFailures = 0,
	localCount,
	remoteCount,
}: HarnessOptions) {
	await seedRemoteEvents(remoteCount);
	relay.failingRequests = initialLoadFailures;

	mocks.createIndexedDbPersister.mockImplementation(
		createPersisterMock((store) => {
			seedEvents(store, localCount, 'local-imported');
		}),
	);

	return { getRemoteCount };
}

export function setupMultiDeviceHarness(localSeeds: LocalSeed[]) {
	const seedsQueue = [...localSeeds];

	mocks.createIndexedDbPersister.mockImplementation(
		createPersisterMock((store) => {
			const nextSeed = seedsQueue.shift() ?? {
				count: 0,
				prefix: 'empty-seed',
			};
			seedEvents(store, nextSeed.count, nextSeed.prefix);
		}),
	);

	return { getRemoteCount };
}

export async function runDeviceSession({
	autoConnect = false,
	expectedAfterConnect,
	expectedAfterImport,
	expectedInitial,
	expectedRemoteCount,
	importCount = 0,
	shouldAddOneEntry = false,
	shouldImportData = false,
}: {
	autoConnect?: boolean;
	expectedAfterConnect: number;
	expectedAfterImport?: number;
	expectedInitial?: number;
	/** Waits until the room has this many events before the session ends. */
	expectedRemoteCount?: number;
	importCount?: number;
	shouldAddOneEntry?: boolean;
	shouldImportData?: boolean;
}) {
	// Every session is a separate device with its own sync state.
	removeItem(STORAGE_KEYS.LOCAL_STORE_ID);
	renderRoomSyncProbe(importCount);

	if (expectedInitial !== undefined) {
		await waitFor(() => {
			expectEventCount(expectedInitial);
		});
	}

	if (!autoConnect) {
		fireEvent.click(screen.getByRole('button', { name: 'Connect room' }));
	}

	await waitFor(
		() => {
			expectEventCount(expectedAfterConnect);
		},
		{ timeout: 10_000 },
	);

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

	if (expectedRemoteCount !== undefined) {
		await waitFor(
			async () => {
				expect(await getRemoteCount()).toBe(expectedRemoteCount);
			},
			{ timeout: 10_000 },
		);
	}
	cleanup();
}
