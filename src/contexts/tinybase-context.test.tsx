import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import { useContext } from 'react';
import { type MergeableStore } from 'tinybase';
import { useStore, useTable, useValue } from 'tinybase/ui-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_PROFILE, TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { TinybaseProvider } from './tinybase-context';

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
	destroy: ReturnType<typeof vi.fn>;
	load: ReturnType<typeof vi.fn>;
	save: ReturnType<typeof vi.fn>;
	startAutoSave: ReturnType<typeof vi.fn>;
	stopAutoSave: ReturnType<typeof vi.fn>;
}

interface RemoteSynchronizerMock {
	destroy: ReturnType<typeof vi.fn>;
	startSync: ReturnType<typeof vi.fn>;
	stopSync: ReturnType<typeof vi.fn>;
}

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
		localStorage.clear();
		mocks.createSecurePartyKitSynchronizer.mockReset();
		mocks.createSecurePartyKitPersister.mockReset();
		mocks.createMergeableIndexedDbPersister.mockReset();
		mocks.createIndexedDbPersister.mockReset();
		mocks.getEncryptionKey.mockReset();
		mocks.hashRoomId.mockReset();
		mocks.runMigrationsIfNeeded.mockReset();

		mocks.getEncryptionKey.mockResolvedValue({} as CryptoKey);
		mocks.hashRoomId.mockResolvedValue('hashed-regression-room');
		mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });

		mocks.createIndexedDbPersister.mockImplementation(() => ({
			destroy: vi.fn(async () => {}),
			load: vi.fn(async () => {}),
		}));

		mocks.createMergeableIndexedDbPersister.mockImplementation(
			(store: MergeableStore) => ({
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
			}),
		);

		mocks.createSecurePartyKitPersister.mockImplementation(
			(): RemotePersisterMock => {
				const remotePersister: RemotePersisterMock = {
					destroy: vi.fn(async () => {}),
					load: vi.fn(async () => {}),
					save: vi.fn(async () => {}),
					startAutoSave: vi.fn(async () => {}),
					stopAutoSave: vi.fn(async () => {}),
				};

				return remotePersister;
			},
		);

		mocks.createSecurePartyKitSynchronizer.mockImplementation(
			(): RemoteSynchronizerMock => {
				const remoteSynchronizer: RemoteSynchronizerMock = {
					destroy: vi.fn(async () => {}),
					startSync: vi.fn(async () => {
						return remoteSynchronizer;
					}),
					stopSync: vi.fn(async () => {
						return remoteSynchronizer;
					}),
				};

				return remoteSynchronizer;
			},
		);
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

		fireEvent.click(screen.getByRole('button', { name: 'Create room' }));

		await waitFor(() => {
			expect(mocks.hashRoomId).toHaveBeenCalledWith('regression-room');
			expect(mocks.getEncryptionKey).toHaveBeenCalledWith('regression-room');
			expect(mocks.createSecurePartyKitSynchronizer).toHaveBeenCalledTimes(1);
			expect(screen.getByTestId('event-count')).toHaveTextContent('1');
			expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
		});

		const remoteSynchronizer = mocks.createSecurePartyKitSynchronizer.mock
			.results[0]?.value as RemoteSynchronizerMock;
		expect(remoteSynchronizer.startSync).toHaveBeenCalledTimes(1);

		const remotePersister = mocks.createSecurePartyKitPersister.mock.results[
			mocks.createSecurePartyKitPersister.mock.calls.length - 1
		]?.value as RemotePersisterMock;
		expect(remotePersister.load).toHaveBeenCalledTimes(1);
		expect(
			mocks.createSecurePartyKitPersister.mock.results[0]?.value.startAutoSave,
		).toHaveBeenCalledTimes(1);
	});

	it.each([
		['tiny', 10],
		['medium', 1000],
		['large', 10_000],
		['huge', 60_000],
	])(
		'keeps %s datasets after 10s delayed room refresh',
		async (_sizeLabel, eventCount) => {
			mocks.createMergeableIndexedDbPersister.mockImplementationOnce(
				(store: MergeableStore) => ({
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
				}),
			);

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
					expect(screen.getByTestId('event-count')).toHaveTextContent(
						String(eventCount),
					);
					expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
				},
				{ timeout: 30_000 },
			);

			await new Promise((resolve) => setTimeout(resolve, 100)); // Shortened for tests

			document.dispatchEvent(new Event('visibilitychange'));
			window.dispatchEvent(new Event('focus'));

			await waitFor(
				() => {
					expect(screen.getByTestId('event-count')).toHaveTextContent(
						String(eventCount),
					);
					expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
				},
				{ timeout: 30_000 },
			);

			const remoteSynchronizer = mocks.createSecurePartyKitSynchronizer.mock
				.results[0]?.value as RemoteSynchronizerMock;
			expect(remoteSynchronizer.startSync).toHaveBeenCalledTimes(1);
		},
		120_000,
	);
});
