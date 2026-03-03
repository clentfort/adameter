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
import { STORE_VALUE_PROFILE, TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { TinybaseProvider } from './tinybase-context';

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
	destroy: ReturnType<typeof vi.fn>;
	load: ReturnType<typeof vi.fn>;
	save: ReturnType<typeof vi.fn>;
	startAutoLoad: ReturnType<typeof vi.fn>;
	startAutoSave: ReturnType<typeof vi.fn>;
	stopAutoLoad: ReturnType<typeof vi.fn>;
	stopAutoSave: ReturnType<typeof vi.fn>;
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
		mocks.createSecurePartyKitPersister.mockReset();
		mocks.createIndexedDbPersister.mockReset();
		mocks.getEncryptionKey.mockReset();
		mocks.hashRoomId.mockReset();
		mocks.runMigrationsIfNeeded.mockReset();

		mocks.getEncryptionKey.mockResolvedValue({} as CryptoKey);
		mocks.hashRoomId.mockResolvedValue('hashed-regression-room');
		mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });

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

		mocks.createSecurePartyKitPersister.mockImplementation(
			(store: Store): RemotePersisterMock => {
				const remotePersister: RemotePersisterMock = {
					destroy: vi.fn(async () => {}),
					load: vi.fn(async () => {
						store.setContent([{}, {}]);
					}),
					save: vi.fn(async () => {}),
					startAutoLoad: vi.fn(async () => {
						await (remotePersister.load as unknown as () => Promise<void>)();
					}),
					startAutoSave: vi.fn(async () => {}),
					stopAutoLoad: vi.fn(async () => {}),
					stopAutoSave: vi.fn(async () => {}),
				};

				return remotePersister;
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
			expect(mocks.createSecurePartyKitPersister).toHaveBeenCalledTimes(1);
			expect(screen.getByTestId('event-count')).toHaveTextContent('1');
			expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
		});

		const remotePersister = mocks.createSecurePartyKitPersister.mock.results[0]
			?.value as RemotePersisterMock;

		expect(remotePersister.load).toHaveBeenCalledTimes(1);
		expect(remotePersister.startAutoLoad).toHaveBeenCalledTimes(1);
		expect(remotePersister.startAutoSave).toHaveBeenCalledTimes(1);
	});

	it.each([
		['tiny', 10],
		['medium', 1000],
		['large', 10_000],
		['huge', 60_000],
	])(
		'keeps %s datasets after 10s delayed room refresh',
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
					expect(screen.getByTestId('event-count')).toHaveTextContent(
						String(eventCount),
					);
					expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
				},
				{ timeout: 30_000 },
			);

			await new Promise((resolve) => setTimeout(resolve, 10_000));

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

			const remotePersister = mocks.createSecurePartyKitPersister.mock
				.results[0]?.value as RemotePersisterMock;

			expect(remotePersister.startAutoLoad).toHaveBeenCalledTimes(1);
			expect(remotePersister.startAutoSave).toHaveBeenCalledTimes(1);
			expect(remotePersister.load).toHaveBeenCalledTimes(3);
		},
		120_000,
	);
});
