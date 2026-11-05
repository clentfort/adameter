import 'fake-indexeddb/auto';
import type { MergeableContent, MergeableStore, Store } from 'tinybase';
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { useContext } from 'react';
import { createMergeableStore } from 'tinybase';
import {
	createCellSync,
	createMemoryCellSyncStateStore,
	getCellKeys,
	hashRoomId,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { useStore, useTable, useValue } from 'tinybase/ui-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/lib/logger';
import { clear, getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import {
	STORE_VALUE_PROFILE,
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import { resetLocalData } from '@/lib/tinybase-sync/factory-reset';
import { installFakeCellRelay } from '@/test-utils/fake-cell-relay';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { useRoomSyncStatus } from './room-sync-status-context';
import { TinybaseProvider } from './tinybase-context';

const ROOM_NAME = 'regression-room';
const EMPTY_MERGEABLE_CONTENT: MergeableContent = [
	[{}, '', 0],
	[{}, '', 0],
];

type Listener = (event: { data?: unknown }) => void;

const mocks = vi.hoisted(() => ({
	cloneRoomData: vi.fn(),
	createIndexedDbPersister: vi.fn(),
	runMigrationsIfNeeded: vi.fn(),
	sockets: [] as {
		closed: boolean;
		emit: (type: string, event?: { data?: unknown }) => void;
		options: Record<string, unknown>;
	}[],
}));

vi.mock('partysocket', () => ({
	default: class MockPartySocket {
		closed = false;
		listeners = new Map<string, Set<Listener>>();
		options: Record<string, unknown>;

		constructor(options: Record<string, unknown>) {
			this.options = options;
			mocks.sockets.push(this);
		}

		addEventListener(type: string, listener: Listener) {
			if (!this.listeners.has(type)) this.listeners.set(type, new Set());
			this.listeners.get(type)!.add(listener);
		}

		close() {
			this.closed = true;
		}

		emit(type: string, event: { data?: unknown } = {}) {
			for (const listener of this.listeners.get(type) ?? []) listener(event);
		}

		removeEventListener(type: string, listener: Listener) {
			this.listeners.get(type)?.delete(listener);
		}
	},
}));

vi.mock('tinybase/persisters/persister-indexed-db', () => ({
	createIndexedDbPersister: mocks.createIndexedDbPersister,
}));

vi.mock('@/migrations/run-if-needed', () => ({
	runMigrationsIfNeeded: mocks.runMigrationsIfNeeded,
}));

vi.mock('@/lib/tinybase-sync/cloning', () => ({
	cloneRoomData: mocks.cloneRoomData,
}));

let relay: ReturnType<typeof installFakeCellRelay>;

function createPersisterMock(seed: (store: Store) => void) {
	return (store: MergeableStore) => ({
		destroy: vi.fn(async () => {}),
		load: vi.fn(async () => {
			// Like a fresh page load. setContent would add deletions that sync.
			store.setMergeableContent(EMPTY_MERGEABLE_CONTENT);
			seed(store);
		}),
		save: vi.fn(async () => {}),
		startAutoSave: vi.fn(async () => {}),
		stopAutoSave: vi.fn(async () => {}),
	});
}

function seedLocalEvent(store: Store) {
	store.setRow(TABLE_IDS.EVENTS, 'local-event', {
		deviceId: 'local-device',
		startDate: '2026-03-03T00:00:00.000Z',
		title: 'Local event',
		type: 'point',
	});
	store.setValue(
		STORE_VALUE_PROFILE,
		JSON.stringify({ color: '#22c55e', name: 'Ada' }),
	);
}

async function getRoomHash() {
	return hashRoomId(ROOM_NAME);
}

async function getRemoteStore() {
	return relay.getStore(ROOM_NAME, await getRoomHash());
}

/** Uploads an event to the room, as another device would. */
async function addRemoteEvent(rowId: string) {
	const store = createMergeableStore();
	store.setRow(TABLE_IDS.EVENTS, rowId, {
		deviceId: 'remote-device',
		startDate: '2026-03-04T00:00:00.000Z',
		title: rowId,
		type: 'point',
	});
	const cellSync = createCellSync({
		cellsUrl: `http://localhost:1999/parties/tinybase/${await getRoomHash()}/cells`,
		keys: await getCellKeys(ROOM_NAME),
		state: createMemoryCellSyncStateStore(),
		store,
	});
	await cellSync.init();
	await cellSync.push();
	await cellSync.dispose();
}

function RoomSyncProbe() {
	const store = useStore()!;
	const eventTable = useTable(TABLE_IDS.EVENTS, store);
	const profile = useValue(STORE_VALUE_PROFILE);
	const status = useRoomSyncStatus();
	const { joinRoom } = useContext(DataSynchronizationContext);

	const eventCount = eventTable ? Object.keys(eventTable).length : 0;
	const hasProfile = typeof profile === 'string' && profile.length > 0;

	return (
		<div>
			<button onClick={() => joinRoom(ROOM_NAME, 'merge')} type="button">
				Create room
			</button>
			<button onClick={() => joinRoom(ROOM_NAME, 'clear')} type="button">
				Join and clear
			</button>
			<button onClick={() => joinRoom('other-room', 'merge')} type="button">
				Switch room
			</button>
			<button
				onClick={() => {
					store.setCell(TABLE_IDS.EVENTS, 'local-event', 'title', 'Edited');
				}}
				type="button"
			>
				Edit event
			</button>
			<span data-testid="event-count">{eventCount}</span>
			<span data-testid="has-profile">{hasProfile ? 'yes' : 'no'}</span>
			<span data-testid="sync-status">{status ?? 'none'}</span>
		</div>
	);
}

function renderProvider() {
	return render(
		<DataSynchronizationProvider>
			<TinybaseProvider>
				<RoomSyncProbe />
			</TinybaseProvider>
		</DataSynchronizationProvider>,
	);
}

async function joinRoomAndSync() {
	await waitFor(() => {
		expect(screen.getByTestId('event-count')).toHaveTextContent('1');
	});
	fireEvent.click(screen.getByRole('button', { name: 'Create room' }));
	await waitFor(
		() => {
			expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
		},
		{ timeout: 5000 },
	);
	await waitFor(() => expect(mocks.sockets).toHaveLength(1));
	return mocks.sockets[0];
}

describe('TinybaseProvider room sync', () => {
	beforeEach(() => {
		clear();
		mocks.sockets.length = 0;
		mocks.cloneRoomData.mockReset();
		mocks.createIndexedDbPersister.mockReset();
		mocks.createIndexedDbPersister.mockImplementation(
			createPersisterMock(seedLocalEvent),
		);
		mocks.runMigrationsIfNeeded.mockReset();
		mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });
		relay = installFakeCellRelay();
	});

	afterEach(() => {
		cleanup();
		vi.unstubAllEnvs();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('keeps local data when joining a room and uploads it', async () => {
		renderProvider();

		const socket = await joinRoomAndSync();

		expect(screen.getByTestId('event-count')).toHaveTextContent('1');
		expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
		const remote = await getRemoteStore();
		expect(remote.getCell(TABLE_IDS.EVENTS, 'local-event', 'title')).toBe(
			'Local event',
		);
		expect(socket.options).toMatchObject({
			party: 'tinybase',
			query: { protocol: 'cells' },
			room: await getRoomHash(),
		});
	});

	it('uploads local data even when the legacy snapshot cannot be read', async () => {
		vi.spyOn(logger, 'warn').mockImplementation(() => {});
		relay.isStoreFailing = true;
		renderProvider();

		await joinRoomAndSync();

		const remote = await getRemoteStore();
		expect(remote.hasRow(TABLE_IDS.EVENTS, 'local-event')).toBe(true);
	});

	it('merges what is already in the room', async () => {
		await addRemoteEvent('remote-event');
		renderProvider();

		await joinRoomAndSync();

		await waitFor(() => {
			expect(screen.getByTestId('event-count')).toHaveTextContent('2');
		});
	});

	it('applies broadcasts of other devices without another request', async () => {
		renderProvider();
		const socket = await joinRoomAndSync();
		const requestsBefore = relay.requests.length;

		await addRemoteEvent('remote-event');
		await act(async () => {
			socket.emit('message', { data: relay.broadcasts.at(-1) });
		});

		await waitFor(() => {
			expect(screen.getByTestId('event-count')).toHaveTextContent('2');
		});
		// Only the upload of the other device.
		expect(relay.requests.slice(requestsBefore)).toEqual([
			expect.objectContaining({ method: 'POST' }),
		]);
	});

	it('pulls missed changes after the socket reconnects', async () => {
		renderProvider();
		const socket = await joinRoomAndSync();
		await addRemoteEvent('missed-event');

		act(() => {
			socket.emit('open');
		});

		await waitFor(() => {
			expect(screen.getByTestId('event-count')).toHaveTextContent('2');
		});
	});

	it('uploads local changes after a debounce', async () => {
		renderProvider();
		await joinRoomAndSync();

		fireEvent.click(screen.getByRole('button', { name: 'Edit event' }));

		await waitFor(
			async () => {
				const remote = await getRemoteStore();
				expect(remote.getCell(TABLE_IDS.EVENTS, 'local-event', 'title')).toBe(
					'Edited',
				);
			},
			{ timeout: 5000 },
		);
	});

	it('keeps rendering local data while the relay is unreachable', async () => {
		vi.spyOn(logger, 'warn').mockImplementation(() => {});
		relay.isUnreachable = true;
		renderProvider();
		await waitFor(() => {
			expect(screen.getByTestId('event-count')).toHaveTextContent('1');
		});

		fireEvent.click(screen.getByRole('button', { name: 'Create room' }));

		await waitFor(() => {
			expect(screen.getByTestId('sync-status')).toHaveTextContent('offline');
		});
		expect(screen.getByTestId('event-count')).toHaveTextContent('1');

		relay.isUnreachable = false;
		act(() => {
			window.dispatchEvent(new Event('online'));
		});
		await waitFor(
			() => {
				expect(screen.getByTestId('sync-status')).toHaveTextContent('synced');
			},
			{ timeout: 15_000 },
		);
	});

	it('joins with a fresh store for the clear strategy instead of deleting rows', async () => {
		const reload = vi.fn();
		vi.stubGlobal('location', { ...window.location, reload });
		renderProvider();
		await waitFor(() => {
			expect(screen.getByTestId('event-count')).toHaveTextContent('1');
		});

		fireEvent.click(screen.getByRole('button', { name: 'Join and clear' }));

		await waitFor(() => expect(reload).toHaveBeenCalled());
		expect(getItem(STORAGE_KEYS.LOCAL_DB_NAME)).toMatch(
			/^adameter-tinybase-store-/,
		);
		expect(getItem(STORAGE_KEYS.ROOM)).toBe(ROOM_NAME);
		expect(getItem(STORAGE_KEYS.ROOM_JOIN_STRATEGY)).toBe('merge');
		// Nothing, in particular no deletion, reached the room.
		expect(relay.requests).toEqual([]);
		expect(screen.getByTestId('event-count')).toHaveTextContent('1');
	});

	it('loads the current local store', async () => {
		setItem(STORAGE_KEYS.LOCAL_DB_NAME, 'adameter-tinybase-store-current');

		renderProvider();

		await waitFor(() => {
			expect(mocks.createIndexedDbPersister).toHaveBeenCalledWith(
				expect.anything(),
				'adameter-tinybase-store-current',
				undefined,
				expect.any(Function),
			);
		});
	});

	it('reloads when another tab resets the local data', async () => {
		const reload = vi.fn();
		vi.stubGlobal('location', { ...window.location, reload });
		renderProvider();
		await waitFor(() => {
			expect(screen.getByTestId('event-count')).toHaveTextContent('1');
		});

		resetLocalData();

		await waitFor(() => expect(reload).toHaveBeenCalled());
	});

	it('stops syncing the previous room when switching rooms', async () => {
		renderProvider();
		const firstSocket = await joinRoomAndSync();

		fireEvent.click(screen.getByRole('button', { name: 'Switch room' }));

		await waitFor(() => expect(mocks.sockets).toHaveLength(2));
		expect(firstSocket.closed).toBe(true);
		const otherRoomHash = await hashRoomId('other-room');
		await waitFor(
			async () => {
				const remote = await relay.getStore('other-room', otherRoomHash);
				expect(remote.hasRow(TABLE_IDS.EVENTS, 'local-event')).toBe(true);
			},
			{ timeout: 5000 },
		);
	});

	it('clones preview data and exposes the store in preview builds', async () => {
		vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
		vi.stubEnv('NEXT_PUBLIC_MAIN_ROOM_NAME', 'main-room');
		mocks.createIndexedDbPersister.mockImplementation(
			createPersisterMock(() => {}),
		);

		renderProvider();

		await waitFor(() => {
			expect(mocks.cloneRoomData).toHaveBeenCalledWith(
				'main-room',
				expect.any(String),
				expect.anything(),
			);
		});
		expect(
			(window as unknown as { tinybaseStore: Store }).tinybaseStore,
		).toBeDefined();
	});

	it('copies the selected profile id to localStorage', async () => {
		mocks.createIndexedDbPersister.mockImplementation(
			createPersisterMock((store) => {
				store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'profile-123');
			}),
		);

		renderProvider();

		await waitFor(() => {
			expect(getItem(STORAGE_KEYS.SELECTED_PROFILE_ID)).toBe('profile-123');
		});
	});

	it('renders when local initialization fails', async () => {
		const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
		mocks.runMigrationsIfNeeded.mockRejectedValueOnce(
			new Error('Migration failed'),
		);

		renderProvider();

		await waitFor(() => {
			expect(screen.getByTestId('event-count')).toBeInTheDocument();
		});
		expect(errorSpy).toHaveBeenCalledWith(
			'Failed to initialize local store:',
			expect.any(Error),
		);
	});
});
