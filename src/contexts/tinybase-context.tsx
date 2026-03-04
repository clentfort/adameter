'use client';

import type { Store } from 'tinybase';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createStore } from 'tinybase';
import {
	createSecurePartyKitPersister,
	getEncryptionKey,
	hashRoomId,
} from 'tinybase-persister-partykit-client-encrypted';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { Provider } from 'tinybase/ui-react';
import { SplashScreen } from '@/components/splash-screen';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import {
	TINYBASE_LOCAL_DB_NAME,
	TINYBASE_PARTYKIT_PARTY,
} from '@/lib/tinybase-sync/constants';
import { mergeStoreContent } from '@/lib/tinybase-sync/merge';
import {
	reconcileRemoteLoadResult,
	snapshotStoreContentIfNonEmpty,
} from '@/lib/tinybase-sync/remote-bootstrap';
import { isStoreDataEmpty } from '@/lib/tinybase-sync/store-utils';
import { logger } from '@/lib/logger';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getDeviceId } from '@/utils/device-id';
import { DataSynchronizationContext } from './data-synchronization-context';

type RemotePersister = ReturnType<typeof createSecurePartyKitPersister> & {
	hasLoadedPersistedData?: () => boolean;
	hasSavedFullContent?: () => boolean;
};

const defaultStore = createStore();

export const tinybaseContext = createContext<{ store: Store }>({
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
	const [isLocalReady, setIsLocalReady] = useState(false);
	const [isSyncReady, setIsSyncReady] = useState(false);

	useEffect(() => {
		let isDisposed = false;

		const store = storeRef.current;
		const localPersister = createIndexedDbPersister(
			store,
			TINYBASE_LOCAL_DB_NAME,
		);

		const initialize = async () => {
			const startLoad = performance.now();
			await localPersister.load();
			logger.log(
				`[PERF] Local IndexedDB load took ${(performance.now() - startLoad).toFixed(2)}ms`,
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
		let isInitialRemoteSyncComplete = false;
		let shouldSkipNextOpenLoad = true;
		const store = storeRef.current;
		const deviceId = getDeviceId();
		let remotePersister: RemotePersister | undefined;
		let connection: PartySocket | undefined;
		let remoteRefreshPromise = Promise.resolve();
		const INITIAL_REMOTE_LOAD_RETRY_DELAY_MS = 500;
		const INITIAL_REMOTE_LOAD_RETRY_LIMIT = 5;

		setIsSyncReady(false);

		const hasLoadedPersistedData = () =>
			remotePersister?.hasLoadedPersistedData?.() ?? true;

		const hasSavedFullContent = () =>
			remotePersister?.hasSavedFullContent?.() ?? true;

		const ensureInitialRemoteLoad = async () => {
			if (!remotePersister) {
				return false;
			}

			if (hasLoadedPersistedData()) {
				return true;
			}

			const startTotalLoad = performance.now();
			for (
				let retryIndex = 0;
				retryIndex < INITIAL_REMOTE_LOAD_RETRY_LIMIT;
				retryIndex++
			) {
				if (isDisposed) {
					return false;
				}

				await new Promise((resolve) => {
					setTimeout(resolve, INITIAL_REMOTE_LOAD_RETRY_DELAY_MS);
				});

				const startAttempt = performance.now();
				await remotePersister.load();
				logger.log(
					`[PERF] Remote load attempt ${retryIndex + 1} took ${(performance.now() - startAttempt).toFixed(2)}ms`,
				);
				if (hasLoadedPersistedData()) {
					logger.log(
						`[PERF] Total ensureInitialRemoteLoad took ${(performance.now() - startTotalLoad).toFixed(2)}ms`,
					);
					return true;
				}
			}

			return hasLoadedPersistedData();
		};

		const loadRemoteAndApplyMigrations = async () => {
			if (!remotePersister || !isInitialRemoteSyncComplete) {
				return;
			}

			const localSnapshot = snapshotStoreContentIfNonEmpty(store);
			const startRemoteLoad = performance.now();
			await remotePersister.load();
			logger.log(
				`[PERF] remotePersister.load() (refresh) took ${(performance.now() - startRemoteLoad).toFixed(2)}ms`,
			);

			const startRestoration = performance.now();
			let restoredLocal = false;
			if (joinStrategy !== 'clear' && localSnapshot) {
				if (isStoreDataEmpty(store)) {
					store.setContent(localSnapshot);
					restoredLocal = true;
				} else if (joinStrategy === 'merge' || !hasSavedFullContent()) {
					mergeStoreContent(store, localSnapshot, deviceId);
					restoredLocal = true;
				}
			}

			const migrationResult = await runMigrationsIfNeeded(store, {
				deviceId,
			});
			logger.log(
				`[PERF] Post-sync restoration and migrations took ${(performance.now() - startRestoration).toFixed(2)}ms`,
			);
			if (restoredLocal || migrationResult.hasChanges) {
				return;
			}
		};

		const scheduleRemoteRefresh = async () => {
			remoteRefreshPromise = remoteRefreshPromise
				.catch(() => {})
				.then(loadRemoteAndApplyMigrations);

			await remoteRefreshPromise;
		};

		const onOpen = () => {
			if (!isInitialRemoteSyncComplete) {
				return;
			}

			if (shouldSkipNextOpenLoad) {
				shouldSkipNextOpenLoad = false;
				return;
			}

			void scheduleRemoteRefresh().catch(() => {});
		};

		const onVisibilityChange = () => {
			if (document.visibilityState !== 'visible') {
				return;
			}

			connection?.reconnect();
			void scheduleRemoteRefresh().catch(() => {});
		};

		const connectRoomSync = async () => {
			if (isDisposed) {
				return;
			}

			const startConnect = performance.now();
			const localSnapshot = snapshotStoreContentIfNonEmpty(store);
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
			connection.addEventListener('open', onOpen);
			document.addEventListener('visibilitychange', onVisibilityChange);
			window.addEventListener('focus', onVisibilityChange);

			remotePersister = createSecurePartyKitPersister(
				store,
				connection,
				encryptionKey,
				() => {},
			) as RemotePersister;

			const startAutoLoad = performance.now();
			await remotePersister.startAutoLoad();
			logger.log(
				`[PERF] remotePersister.startAutoLoad() took ${(performance.now() - startAutoLoad).toFixed(2)}ms`,
			);

			const startInitialLoad = performance.now();
			const didLoadRemote = await ensureInitialRemoteLoad();
			logger.log(
				`[PERF] Initial remote load check took ${(performance.now() - startInitialLoad).toFixed(2)}ms`,
			);

			if (!didLoadRemote) {
				if (!isDisposed) {
					setIsSyncReady(true);
				}
				return;
			}

			await remotePersister.startAutoSave();

			const startReconcile = performance.now();
			reconcileRemoteLoadResult(store, localSnapshot, joinStrategy, deviceId);
			logger.log(
				`[PERF] reconcileRemoteLoadResult took ${(performance.now() - startReconcile).toFixed(2)}ms`,
			);

			const startPostSyncMigrations = performance.now();
			await runMigrationsIfNeeded(store, {
				deviceId,
			});
			logger.log(
				`[PERF] Post-sync migrations took ${(performance.now() - startPostSyncMigrations).toFixed(2)}ms`,
			);

			isInitialRemoteSyncComplete = true;

			logger.log(
				`[PERF] Total connectRoomSync took ${(performance.now() - startConnect).toFixed(2)}ms`,
			);

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

			void remotePersister.stopAutoLoad();
			void remotePersister.stopAutoSave();
			void remotePersister.destroy();
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
