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

				await remotePersister.load();
				if (hasLoadedPersistedData()) {
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
			await remotePersister.load();

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

			const localSnapshot = snapshotStoreContentIfNonEmpty(store);
			const [hashedRoomId, encryptionKey] = await Promise.all([
				hashRoomId(room),
				getEncryptionKey(room),
			]);

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

			await remotePersister.startAutoLoad();
			const didLoadRemote = await ensureInitialRemoteLoad();
			if (!didLoadRemote) {
				if (!isDisposed) {
					setIsSyncReady(true);
				}
				return;
			}

			await remotePersister.startAutoSave();

			reconcileRemoteLoadResult(store, localSnapshot, joinStrategy, deviceId);
			await runMigrationsIfNeeded(store, {
				deviceId,
			});

			isInitialRemoteSyncComplete = true;

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
