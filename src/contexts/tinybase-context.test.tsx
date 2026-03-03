import type { Store } from 'tinybase';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useContext } from 'react';
import { useStore, useTable, useValue } from 'tinybase/ui-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_PROFILE, TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	DataSynchronizationContext,
	DataSynchronizationProvider,
} from './data-synchronization-context';
import { TinybaseProvider } from './tinybase-context';

const mocks = vi.hoisted(() => ({
	createIndexedDbPersister: vi.fn(),
	createPartyKitPersister: vi.fn(),
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

vi.mock('tinybase/persisters/persister-partykit-client', () => ({
	createPartyKitPersister: mocks.createPartyKitPersister,
}));

vi.mock('@/migrations/run-if-needed', () => ({
	runMigrationsIfNeeded: mocks.runMigrationsIfNeeded,
}));

interface RemotePersisterMock {
	destroy: ReturnType<typeof vi.fn>;
	load: ReturnType<typeof vi.fn>;
	save: ReturnType<typeof vi.fn>;
	startAutoPersisting: ReturnType<typeof vi.fn>;
	startAutoSave: ReturnType<typeof vi.fn>;
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
	beforeEach(() => {
		localStorage.clear();
		mocks.createIndexedDbPersister.mockReset();
		mocks.createPartyKitPersister.mockReset();
		mocks.runMigrationsIfNeeded.mockReset();

		mocks.runMigrationsIfNeeded.mockResolvedValue({ hasChanges: false });

		mocks.createIndexedDbPersister.mockImplementation((store: Store) => ({
			destroy: vi.fn(async () => {}),
			load: vi.fn(async () => {
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

		mocks.createPartyKitPersister.mockImplementation(
			(store: Store): RemotePersisterMock => ({
				destroy: vi.fn(async () => {}),
				load: vi.fn(async () => {
					store.setContent([{}, {}]);
				}),
				save: vi.fn(async () => {}),
				startAutoPersisting: vi.fn(async () => {
					store.setContent([{}, {}]);
				}),
				startAutoSave: vi.fn(async () => {}),
				stopAutoSave: vi.fn(async () => {}),
			}),
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
			expect(mocks.createPartyKitPersister).toHaveBeenCalledTimes(1);
			expect(screen.getByTestId('event-count')).toHaveTextContent('1');
			expect(screen.getByTestId('has-profile')).toHaveTextContent('yes');
		});

		const remotePersister = mocks.createPartyKitPersister.mock.results[0]
			?.value as RemotePersisterMock;

		expect(remotePersister.load).toHaveBeenCalledTimes(1);
		expect(remotePersister.startAutoSave).toHaveBeenCalledTimes(1);
		expect(remotePersister.startAutoPersisting).not.toHaveBeenCalled();
	});
});
