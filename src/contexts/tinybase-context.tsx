'use client';

import type { MergeableStore } from 'tinybase';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMergeableStore, createStore, getUniqueId } from 'tinybase';
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
	TINYBASE_MERGEABLE_DB_NAME,
	TINYBASE_PARTYKIT_PARTY,
} from '@/lib/tinybase-sync/constants';
import {
	createMergeableBlobIndexedDbPersister,
	createMergeableIndexedDbPersister,
} from '@/lib/tinybase-sync/indexed-db-mergeable';
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
			TINYBASE_MERGEABLE_DB_NAME,
		);

		const initialize = async () => {
			const startLoad = performance.now();
			await localPersister.load();

			// Migration logic:
			if (isStoreDataEmpty(store)) {
				// 1. Try loading from the temporary "blob" mergeable format if it exists (from my previous unfinished work)
				const blobPersister = createMergeableBlobIndexedDbPersister(
					store,
					TINYBASE_LOCAL_DB_NAME,
				);
				await blobPersister.load();

				if (isStoreDataEmpty(store)) {
					// 2. Try loading from legacy TinyBase Store (unmergeable) IndexedDB format
					const oldStore = createStore();
					const oldPersister = createIndexedDbPersister(
						oldStore,
						TINYBASE_LOCAL_DB_NAME,
					);
					await oldPersister.load();
					if (!isStoreDataEmpty(oldStore)) {
						store.setContent(oldStore.getContent());
						logger.log('Migrated data from legacy IndexedDB format');
					}
					await oldPersister.destroy();
				} else {
					logger.log('Migrated data from temporary blob mergeable format');
				}

				if (!isStoreDataEmpty(store)) {
					await localPersister.save();
				}
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
				id: getUniqueId(),
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

			try {
				// Loading the remote state ensures the persister is correctly initialized
				// and marked as having loaded data, allowing auto-save to start immediately.
				// Merging is handled internally by the persister's getPersisted() override.
				await remotePersister.load();
			} catch (error) {
				logger.error('Error loading remote store:', error);
			}

			logger.log(
				`[PERF] Initial remote load took ${(performance.now() - startRemoteLoad).toFixed(2)}ms`,
			);

			// Unblock the UI as soon as the initial remote data is merged.
			// P2P sync and background persistence will continue in parallel.
			if (!isDisposed) {
				setIsSyncReady(true);
			}

			// Start backing up local changes to the remote snapshot as soon as possible.
			await remotePersister.startAutoSave();

			const startSync = performance.now();

			// Peer synchronization (P2P via WebSockets)
			try {
				if (connection.readyState !== PartySocket.OPEN) {
					await new Promise((resolve) => {
						connection?.addEventListener('open', resolve, { once: true });
					});
				}
				await synchronizer.startSync();
			} catch (error) {
				logger.error('Error starting synchronizer:', error);
			}

			logger.log(
				`[PERF] synchronizer.startSync() took ${(performance.now() - startSync).toFixed(2)}ms`,
			);

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
		};

		void connectRoomSync().catch((error) => {
			logger.error('Error connecting to room:', error);
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
