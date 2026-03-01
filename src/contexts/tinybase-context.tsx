'use client';

import type { Store } from 'tinybase';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createStore } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
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
import { createSecurePartyKitPersister } from '@/lib/tinybase-sync/secure-partykit-persister';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getEncryptionKey, hashRoomId } from '@/utils/crypto';
import { getDeviceId } from '@/utils/device-id';
import { DataSynchronizationContext } from './data-synchronization-context';

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
		const store = storeRef.current;
		const deviceId = getDeviceId();
		let remotePersister:
			| ReturnType<typeof createSecurePartyKitPersister>
			| undefined;
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
		<tinybaseContext.Provider value={{ store: storeRef.current }}>
			<Provider store={storeRef.current}>{children}</Provider>
		</tinybaseContext.Provider>
	);
}
