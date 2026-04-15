import type { Store } from 'tinybase';
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { useContext } from 'react';
import { useStore, useTable, useValue } from 'tinybase/ui-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clear } from '@/lib/storage';
import { STORE_VALUE_PROFILE, TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { TinybaseProvider } from './tinybase-context';

const mocks = vi.hoisted(() => ({
	cloneRoomData: vi.fn(),
	createEncryptedPartyKitSynchronizer: vi.fn(),
	createIndexedDbPersister: vi.fn(),
	getEncryptionKey: vi.fn(),
	getStoreUrl: vi.fn(),
	hashRoomId: vi.fn(),
	loadServerSnapshot: vi.fn(),
	partySocketClose: vi.fn(),
	runMigrationsIfNeeded: vi.fn(),
	saveServerSnapshot: vi.fn(),
}));

vi.mock('partysocket', () => ({
	default: class MockPartySocket {
		partySocketOptions = { host: 'localhost:1999', room: 'test-room' };
		name = 'tinybase';
		readyState = 1; // WebSocket.OPEN
		addEventListener() {}
		close() {
			mocks.partySocketClose();
		}
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

vi.mock('@/lib/tinybase-sync/cloning', () => ({
	cloneRoomData: mocks.cloneRoomData,
}));

function RoomSyncProbe() {
	const store = useStore()!;
	const eventTable = useTable(TABLE_IDS.EVENTS, store);
	const profile = useValue(STORE_VALUE_PROFILE);
	const { joinRoom } = useContext(DataSynchronizationContext);

	const eventCount = eventTable ? Object.keys(eventTable).length : 0;
	const hasProfile = typeof profile === 'string' && profile.length > 0;

	return (
		<div>
			<button
				onClick={() => joinRoom('regression-room', 'merge')}
				type="button"
			>
				Create room
			</button>
			<span data-testid="event-count">{eventCount}</span>
			<span data-testid="has-profile">{hasProfile ? 'yes' : 'no'}</span>
		</div>
	);
}

describe('TinybaseProvider room sync', () => {
	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	beforeEach(() => {
		clear();
		mocks.createEncryptedPartyKitSynchronizer.mockReset();
		mocks.createIndexedDbPersister.mockReset();
		mocks.getEncryptionKey.mockReset();
		mocks.getStoreUrl.mockReset();
		mocks.hashRoomId.mockReset();
		mocks.loadServerSnapshot.mockReset();
		mocks.runMigrationsIfNeeded.mockReset();
		mocks.saveServerSnapshot.mockReset();

		mocks.getEncryptionKey.mockResolvedValue({} as CryptoKey);
		mocks.hashRoomId.mockResolvedValue('hashed-regression-room');
		mocks.getStoreUrl.mockReturnValue(
			'http://localhost:1999/parties/tinybase/hashed-regression-room/store',
		);
		mocks.loadServerSnapshot.mockResolvedValue(false);
		mocks.saveServerSnapshot.mockResolvedValue(undefined);
		mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });
		mocks.partySocketClose.mockReset();

		mocks.createEncryptedPartyKitSynchronizer.mockResolvedValue({
			destroy: vi.fn(async () => {}),
			startSync: vi.fn(async () => {}),
		});

		mocks.createIndexedDbPersister.mockImplementation((store: Store) => ({
			destroy: vi.fn(async () => {}),
			load: vi.fn(async () => {
				store.setContent([{}, {}]);
				store.setRow(TABLE_IDS.EVENTS, 'local-event', {
					deviceId: 'local-device',
					startDate: '2026-03-03T00:00:00.000Z',
					title: 'Local event',
					type: 'point',
				});
				store.setValue(
					STORE_VALUE_PROFILE,
					JSON.stringify({
						color: '#22c55e',
						name: 'Ada',
					}),
				);
			}),
			startAutoSave: vi.fn(async () => {}),
			stopAutoSave: vi.fn(async () => {}),
		}));
	});

	it('keeps local data when creating/joining a room with merge strategy', async () => {
		render(
			<DataSynchronizationProvider>
				<TinybaseProvider>
					<RoomSyncProbe />
				</TinybaseProvider>
			</DataSynchronizationProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId('event-count')).toHaveTextContent('1');
			expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
		});

		await waitFor(() => {
			expect(
				screen.getByRole('button', { name: 'Create room' }),
			).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: 'Create room' }));

		await waitFor(() => {
			expect(mocks.hashRoomId).toHaveBeenCalledWith('regression-room');
			expect(mocks.getEncryptionKey).toHaveBeenCalledWith('regression-room');
			expect(mocks.createEncryptedPartyKitSynchronizer).toHaveBeenCalledTimes(
				1,
			);
			expect(screen.getByTestId('event-count')).toHaveTextContent('1');
			expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
		});

		expect(mocks.loadServerSnapshot).toHaveBeenCalledTimes(1);
	});

	it('covers additional edge cases in TinybaseProvider', async () => {
		vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
		vi.stubEnv('NEXT_PUBLIC_MAIN_ROOM_NAME', 'main-room');
		vi.stubGlobal('__E2E_TESTS__', true);

		try {
			mocks.loadServerSnapshot.mockResolvedValue(true);
			mocks.cloneRoomData.mockResolvedValue(undefined);
			mocks.createIndexedDbPersister.mockImplementationOnce((store: Store) => ({
				destroy: vi.fn(async () => {}),
				load: vi.fn(async () => {
					store.setContent([{}, {}]);
				}),
				save: vi.fn(async () => {}),
				startAutoSave: vi.fn(async () => {}),
				stopAutoSave: vi.fn(async () => {}),
			}));

			render(
				<DataSynchronizationProvider>
					<TinybaseProvider>
						<RoomSyncProbe />
					</TinybaseProvider>
				</DataSynchronizationProvider>,
			);

			await waitFor(() => {
				expect(
					screen.queryByRole('button', { name: 'Create room' }),
				).toBeInTheDocument();
			});

			expect(mocks.cloneRoomData).toHaveBeenCalled();
			expect(
				(window as unknown as { tinybaseStore: Store }).tinybaseStore,
			).toBeDefined();

			fireEvent.click(screen.getByRole('button', { name: 'Create room' }));

			await waitFor(() => {
				expect(mocks.loadServerSnapshot).toHaveBeenCalled();
				expect(mocks.saveServerSnapshot).toHaveBeenCalled();
			});
		} finally {
			vi.unstubAllEnvs();
			vi.unstubAllGlobals();
		}
	});

	it.each([
		['tiny', 10],
		['medium', 1000],
		['large', 10_000],
		['huge', 60_000],
	])(
		'keeps %s datasets after joining a room',
		async (_sizeLabel, eventCount) => {
			mocks.createIndexedDbPersister.mockImplementationOnce((store: Store) => ({
				destroy: vi.fn(async () => {}),
				load: vi.fn(async () => {
					store.setContent([{}, {}]);
					for (let index = 0; index < eventCount; index++) {
						store.setRow(TABLE_IDS.EVENTS, `local-event-${index}`, {
							deviceId: 'local-device',
							startDate: '2026-03-03T00:00:00.000Z',
							title: `e${index}`,
							type: 'point',
						});
					}

					store.setValue(
						STORE_VALUE_PROFILE,
						JSON.stringify({
							color: '#22c55e',
							name: 'Ada Large',
						}),
					);
				}),
				startAutoSave: vi.fn(async () => {}),
				stopAutoSave: vi.fn(async () => {}),
			}));

			render(
				<DataSynchronizationProvider>
					<TinybaseProvider>
						<RoomSyncProbe />
					</TinybaseProvider>
				</DataSynchronizationProvider>,
			);

			await waitFor(
				() => {
					expect(screen.getByTestId('event-count')).toHaveTextContent(
						String(eventCount),
					);
					expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
				},
				{ timeout: 30_000 },
			);

			fireEvent.click(screen.getByRole('button', { name: 'Create room' }));

			await waitFor(
				() => {
					expect(
						mocks.createEncryptedPartyKitSynchronizer,
					).toHaveBeenCalledTimes(1);
					expect(screen.getByTestId('event-count')).toHaveTextContent(
						String(eventCount),
					);
					expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
				},
				{ timeout: 30_000 },
			);
		},
		120_000,
	);

	it(
		'closes the connection if unmounted before synchronizer is created',
		{ timeout: 20_000 },
		async () => {
			let resolveSnapshot: (value: boolean) => void;
			const snapshotPromise = new Promise<boolean>((resolve) => {
				resolveSnapshot = resolve;
			});
			mocks.loadServerSnapshot.mockReturnValue(snapshotPromise);

			mocks.createIndexedDbPersister.mockImplementationOnce((store: Store) => ({
				destroy: vi.fn(async () => {}),
				load: vi.fn(async () => {
					store.setContent([{}, {}]);
					store.setRow(TABLE_IDS.EVENTS, 'local-event', {
						deviceId: 'local-device',
						startDate: '2026-03-03T00:00:00.000Z',
						title: 'Local event',
						type: 'point',
					});
				}),
				startAutoSave: vi.fn(async () => {}),
				stopAutoSave: vi.fn(async () => {}),
			}));

			const { unmount } = render(
				<DataSynchronizationProvider>
					<TinybaseProvider>
						<RoomSyncProbe />
					</TinybaseProvider>
				</DataSynchronizationProvider>,
			);

			// Wait for initial hydration and local load to complete
			await waitFor(() => {
				expect(mocks.runMigrationsIfNeeded).toHaveBeenCalled();
			});

			fireEvent.click(screen.getByRole('button', { name: 'Create room' }));

			// Wait for connection to be created (hashRoomId is called first)
			await waitFor(() => {
				expect(mocks.hashRoomId).toHaveBeenCalled();
			});

			// Unmount while loadServerSnapshot is still pending (synchronizer not created yet)
			unmount();

			expect(mocks.partySocketClose).toHaveBeenCalled();

			// Cleanup the pending promise
			resolveSnapshot!(false);
		},
	);
});
