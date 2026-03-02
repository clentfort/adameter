'use client';

import type { Queries, Store } from 'tinybase';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createQueries, createStore } from 'tinybase';
import { defineStatisticsQueries } from '@/lib/tinybase-sync/queries';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { createPartyKitPersister } from 'tinybase/persisters/persister-partykit-client';
import { Provider } from 'tinybase/ui-react';
import { SplashScreen } from '@/components/splash-screen';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import {
	TINYBASE_LOCAL_DB_NAME,
	TINYBASE_PARTYKIT_PARTY,
} from '@/lib/tinybase-sync/constants';
import {
	reconcileRemoteLoadResult,
	snapshotStoreContentIfNonEmpty,
} from '@/lib/tinybase-sync/remote-bootstrap';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getDeviceId } from '@/utils/device-id';
import { DataSynchronizationContext } from './data-synchronization-context';

const defaultStore = createStore();
const defaultQueries = createQueries(defaultStore);

export const tinybaseContext = createContext<{
	queries: Queries;
	store: Store;
}>({
	queries: defaultQueries,
	store: defaultStore,
});

interface TinybaseProviderProps {
	children: React.ReactNode;
}

export function TinybaseProvider({ children }: TinybaseProviderProps) {
	const { isHydrated, joinStrategy, room } = useContext(
		DataSynchronizationContext,
	);
	const storeRef = useRef<Store>(defaultStore);
	const queriesRef = useRef<Queries>(defaultQueries);
	const [isLocalReady, setIsLocalReady] = useState(false);
	const [isSyncReady, setIsSyncReady] = useState(false);

	useEffect(() => {
		let isDisposed = false;

		const store = storeRef.current;
		const queries = createQueries(store);
		defineStatisticsQueries(queries);
		queriesRef.current = queries;
		const localPersister = createIndexedDbPersister(
			store,
			TINYBASE_LOCAL_DB_NAME,
		);

		const initialize = async () => {
			await localPersister.load();

			await localPersister.startAutoSave();

			await runMigrationsIfNeeded(store, { deviceId: getDeviceId() });

			if (!isDisposed) {
				setIsLocalReady(true);
			}
		};

		void initialize().catch(() => {
			if (!isDisposed) {
				setIsLocalReady(true);
			}
		});

		return () => {
			isDisposed = true;
			void localPersister.stopAutoSave();
			void localPersister.destroy();
		};
	}, []);

	useEffect(() => {
		if (!isHydrated || !isLocalReady) {
			return;
		}

		if (!room) {
			setIsSyncReady(true);
			return;
		}

		let isDisposed = false;
		const store = storeRef.current;
		const deviceId = getDeviceId();
		let remotePersister: ReturnType<typeof createPartyKitPersister> | undefined;
		let connection: PartySocket | undefined;

		setIsSyncReady(false);

		const loadRemoteAndApplyMigrations = async () => {
			if (!remotePersister) {
				return;
			}

			await remotePersister.load();
			const migrationResult = await runMigrationsIfNeeded(store, {
				deviceId,
			});
			if (migrationResult.hasChanges && joinStrategy !== 'clear') {
				await remotePersister.save();
			}
		};

		const onOpen = () => {
			void loadRemoteAndApplyMigrations().catch(() => {});
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				connection?.reconnect();
				void loadRemoteAndApplyMigrations().catch(() => {});
			}
		};

		const connectRoomSync = async () => {
			if (isDisposed) {
				return;
			}

			connection = new PartySocket({
				host: PARTYKIT_HOST,
				party: TINYBASE_PARTYKIT_PARTY,
				room,
			});
			connection.addEventListener('open', onOpen);
			document.addEventListener('visibilitychange', onVisibilityChange);
			window.addEventListener('focus', onVisibilityChange);

			remotePersister = createPartyKitPersister(
				store,
				connection,
				undefined,
				() => {},
			);

			const localSnapshot = snapshotStoreContentIfNonEmpty(store);
			await remotePersister.load();
			const bootstrapResult = reconcileRemoteLoadResult(
				store,
				localSnapshot,
				joinStrategy,
				deviceId,
			);
			const migrationResult = await runMigrationsIfNeeded(store, {
				deviceId,
			});

			if (
				bootstrapResult.decision === 'restore-local' ||
				bootstrapResult.decision === 'keep-empty' ||
				bootstrapResult.decision === 'merge' ||
				(migrationResult.hasChanges && joinStrategy !== 'clear')
			) {
				await remotePersister.save();
			}

			await remotePersister.startAutoPersisting(undefined, false);

			if (!isDisposed) {
				setIsSyncReady(true);
			}
		};

		void connectRoomSync().catch(() => {
			if (!isDisposed) {
				setIsSyncReady(true);
			}
		});

		return () => {
			isDisposed = true;
			connection?.removeEventListener('open', onOpen);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('focus', onVisibilityChange);

			if (!remotePersister) {
				return;
			}

			void remotePersister.stopAutoPersisting(true);
			void remotePersister.destroy();
		};
	}, [isHydrated, isLocalReady, joinStrategy, room]);

	if (!isHydrated || !isLocalReady || !isSyncReady) {
		return <SplashScreen />;
	}

	return (
		<tinybaseContext.Provider
			value={{ queries: queriesRef.current, store: storeRef.current }}
		>
			<Provider queries={queriesRef.current} store={storeRef.current}>
				{children}
			</Provider>
		</tinybaseContext.Provider>
	);
}
