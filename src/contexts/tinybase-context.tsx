'use client';

import type { MergeableStore } from 'tinybase';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMergeableStore, createStore } from 'tinybase';
import {
	createSecurePartyKitPersister,
	getEncryptionKey,
	hashRoomId,
} from 'tinybase-persister-partykit-client-encrypted';
import { createSecurePartyKitSynchronizer } from 'tinybase-synchronizer-partykit-client-encrypted';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { Provider } from 'tinybase/ui-react';
import { SplashScreen } from '@/components/splash-screen';
import { logger } from '@/lib/logger';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import {
	TINYBASE_LOCAL_DB_NAME,
	TINYBASE_PARTYKIT_PARTY,
} from '@/lib/tinybase-sync/constants';
import { createMergeableIndexedDbPersister } from '@/lib/tinybase-sync/indexed-db-mergeable';
import { isStoreDataEmpty } from '@/lib/tinybase-sync/store-utils';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getDeviceId } from '@/utils/device-id';
import { DataSynchronizationContext } from './data-synchronization-context';

type Synchronizer = ReturnType<typeof createSecurePartyKitSynchronizer>;
type RemotePersister = ReturnType<typeof createSecurePartyKitPersister>;

const defaultStore = createMergeableStore();

export const tinybaseContext = createContext<{ store: MergeableStore }>({
	store: defaultStore,
});

interface TinybaseProviderProps {
	children: React.ReactNode;
}

export function TinybaseProvider({ children }: TinybaseProviderProps) {
	const { isHydrated, joinStrategy, room } = useContext(
		DataSynchronizationContext,
	);
	const storeRef = useRef<MergeableStore>(createMergeableStore(getDeviceId()));
	const [isLocalReady, setIsLocalReady] = useState(false);
	const [isSyncReady, setIsSyncReady] = useState(false);

	useEffect(() => {
		let isDisposed = false;

		const store = storeRef.current;
		const localPersister = createMergeableIndexedDbPersister(
			store,
			TINYBASE_LOCAL_DB_NAME,
		);

		const initialize = async () => {
			const startLoad = performance.now();
			await localPersister.load();

			// Migration logic: if mergeable store is empty, try loading from legacy IndexedDB format
			if (isStoreDataEmpty(store)) {
				const oldStore = createStore();
				const oldPersister = createIndexedDbPersister(
					oldStore,
					TINYBASE_LOCAL_DB_NAME,
				);
				await oldPersister.load();
				if (!isStoreDataEmpty(oldStore)) {
					store.setContent(oldStore.getContent());
					await localPersister.save();
					logger.log('Migrated data from legacy IndexedDB format');
				}
				await oldPersister.destroy();
			}

			logger.log(
				`[PERF] Local storage load took ${(performance.now() - startLoad).toFixed(2)}ms`,
			);

			await localPersister.startAutoSave();

			const startMigrations = performance.now();
			await runMigrationsIfNeeded(store, { deviceId: getDeviceId() });
			logger.log(
				`[PERF] Initial local migrations took ${(performance.now() - startMigrations).toFixed(2)}ms`,
			);

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
		let remotePersister: RemotePersister | undefined;
		let synchronizer: Synchronizer | undefined;
		let connection: PartySocket | undefined;

		setIsSyncReady(false);

		const onVisibilityChange = () => {
			if (document.visibilityState !== 'visible') {
				return;
			}

			connection?.reconnect();
		};

		const connectRoomSync = async () => {
			if (isDisposed) {
				return;
			}

			const startConnect = performance.now();
			const startCrypto = performance.now();
			const [hashedRoomId, encryptionKey] = await Promise.all([
				hashRoomId(room),
				getEncryptionKey(room),
			]);
			logger.log(
				`[PERF] Room crypto setup took ${(performance.now() - startCrypto).toFixed(2)}ms`,
			);

			connection = new PartySocket({
				host: PARTYKIT_HOST,
				party: TINYBASE_PARTYKIT_PARTY,
				room: hashedRoomId,
			});
			document.addEventListener('visibilitychange', onVisibilityChange);
			window.addEventListener('focus', onVisibilityChange);

			remotePersister = createSecurePartyKitPersister(
				store,
				connection,
				encryptionKey,
				(e: unknown) => logger.error('Persister error:', e),
			);

			synchronizer = createSecurePartyKitSynchronizer(
				store,
				connection,
				encryptionKey,
				(e: unknown) => logger.error('Sync error:', e),
			);

			const startRemoteLoad = performance.now();

			// Handle joinStrategy
			if (joinStrategy === 'clear') {
				store.setContent([{}, {}]);
			}

			if (joinStrategy === 'merge' && !isStoreDataEmpty(store)) {
				const tempStore = createMergeableStore();
				const tempPersister = createSecurePartyKitPersister(
					tempStore,
					connection,
					encryptionKey,
				);
				try {
					await tempPersister.load();
					if (!isStoreDataEmpty(tempStore)) {
						store.merge(tempStore);
					}
				} catch (e) {
					logger.error('Error loading remote store for merge:', e);
				} finally {
					await tempPersister.destroy();
				}
			} else {
				try {
					await remotePersister.load();
				} catch (e) {
					logger.error('Error loading remote store:', e);
				}
			}

			logger.log(
				`[PERF] Initial remote load/merge took ${(performance.now() - startRemoteLoad).toFixed(2)}ms`,
			);

			const startSync = performance.now();
			await synchronizer.startSync();
			logger.log(
				`[PERF] synchronizer.startSync() took ${(performance.now() - startSync).toFixed(2)}ms`,
			);

			await remotePersister.startAutoSave();

			// Post-sync migrations if needed
			const startPostSyncMigrations = performance.now();
			await runMigrationsIfNeeded(store, {
				deviceId,
			});
			logger.log(
				`[PERF] Post-sync migrations took ${(performance.now() - startPostSyncMigrations).toFixed(2)}ms`,
			);

			logger.log(
				`[PERF] Total connectRoomSync took ${(performance.now() - startConnect).toFixed(2)}ms`,
			);

			if (!isDisposed) {
				setIsSyncReady(true);
			}
		};

		void connectRoomSync().catch((e) => {
			logger.error('Error connecting to room:', e);
			if (!isDisposed) {
				setIsSyncReady(true);
			}
		});

		return () => {
			isDisposed = true;
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('focus', onVisibilityChange);

			if (remotePersister) {
				void remotePersister.stopAutoSave();
				void remotePersister.destroy();
			}

			if (synchronizer) {
				void synchronizer.stopSync();
				void synchronizer.destroy();
			}

			if (connection) {
				connection.close();
			}
		};
	}, [isHydrated, isLocalReady, joinStrategy, room]);

	if (!isHydrated || !isLocalReady || !isSyncReady) {
		return <SplashScreen />;
	}

	return (
		<tinybaseContext.Provider value={{ store: storeRef.current }}>
			<Provider store={storeRef.current}>{children}</Provider>
		</tinybaseContext.Provider>
	);
}
