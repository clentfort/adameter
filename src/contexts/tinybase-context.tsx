'use client';

import type { MergeableStore } from 'tinybase';
import type { Synchronizer } from 'tinybase/synchronizers';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMergeableStore } from 'tinybase';
import {
	createEncryptedPartyKitSynchronizer,
	getEncryptionKey,
	getStoreUrl,
	hashRoomId,
	loadServerSnapshot,
	saveServerSnapshot,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { Provider } from 'tinybase/ui-react';
import { SplashScreen } from '@/components/splash-screen';
import { logger } from '@/lib/logger';
import { PARTYKIT_HOST, resolvePartykitHost } from '@/lib/partykit-host';
import { cloneRoomData } from '@/lib/tinybase-sync/cloning';
import {
	TINYBASE_LOCAL_DB_NAME,
	TINYBASE_PARTYKIT_PARTY,
} from '@/lib/tinybase-sync/constants';
import { isStoreDataEmpty } from '@/lib/tinybase-sync/store-utils';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getDeviceId } from '@/utils/device-id';
import { DataSynchronizationContext } from './data-synchronization-context';

const defaultStore = createMergeableStore();

export const tinybaseContext = createContext<{ store: MergeableStore }>({
	store: defaultStore,
});

interface TinybaseProviderProps {
	children: React.ReactNode;
}

export function TinybaseProvider({ children }: TinybaseProviderProps) {
	const { isHydrated, room } = useContext(DataSynchronizationContext);
	const storeRef = useRef<MergeableStore>(defaultStore);
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

			if (
				process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' &&
				process.env.NEXT_PUBLIC_MAIN_ROOM_NAME &&
				isStoreDataEmpty(store)
			) {
				try {
					const productionHost = resolvePartykitHost({
						vercelEnv: 'production',
					});
					await cloneRoomData(
						process.env.NEXT_PUBLIC_MAIN_ROOM_NAME,
						productionHost,
						store,
					);
					await localPersister.save();
					logger.log('Auto-cloned data from production in preview environment');
				} catch (error) {
					logger.error('Failed to auto-clone data from production:', error);
				}
			}

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
		let synchronizer: Synchronizer | undefined;
		let connection: PartySocket | undefined;
		let snapshotSaveInterval: ReturnType<typeof setInterval> | undefined;
		const store = storeRef.current;
		const deviceId = getDeviceId();

		setIsSyncReady(false);

		const connectRoomSync = async () => {
			if (isDisposed) return;

			const startConnect = performance.now();

			const [hashedRoomId, encryptionKey] = await Promise.all([
				hashRoomId(room),
				getEncryptionKey(room),
			]);

			connection = new PartySocket({
				host: PARTYKIT_HOST,
				party: TINYBASE_PARTYKIT_PARTY,
				room: hashedRoomId,
			});

			const storeUrl = getStoreUrl(connection);

			// Bootstrap: load encrypted snapshot from server and MERGE into
			// the local MergeableStore.  Because this is a CRDT merge (not a
			// replace), any data the user added locally while offline is
			// preserved — the HLC timestamps decide which cell value wins.
			try {
				const startBootstrap = performance.now();
				const didLoad = await loadServerSnapshot(
					store,
					storeUrl,
					encryptionKey,
				);
				logger.log(
					`[PERF] Server snapshot bootstrap took ${(performance.now() - startBootstrap).toFixed(2)}ms (loaded=${didLoad})`,
				);
			} catch (error) {
				logger.error('Failed to load server snapshot:', error);
			}

			if (isDisposed) return;

			// Run migrations after merging remote data
			await runMigrationsIfNeeded(store, { deviceId });

			// Create the encrypted synchronizer for real-time sync
			synchronizer = await createEncryptedPartyKitSynchronizer(
				store,
				connection,
				encryptionKey,
				(error: unknown) => logger.error('Synchronizer error:', error),
			);

			if (isDisposed) {
				await synchronizer!.destroy();
				return;
			}

			// Start CRDT sync.  This exchanges hashes with any connected
			// peers and applies diffs — all through encrypted messages.
			await synchronizer!.startSync();

			logger.log(
				`[PERF] Total connectRoomSync took ${(performance.now() - startConnect).toFixed(2)}ms`,
			);

			// Periodically save an encrypted snapshot so that future clients
			// can bootstrap when no peers are online.
			const SNAPSHOT_SAVE_INTERVAL_MS = 30_000;
			snapshotSaveInterval = setInterval(() => {
				void saveServerSnapshot(store, storeUrl, encryptionKey).catch(
					(error: unknown) =>
						logger.error('Failed to save server snapshot:', error),
				);
			}, SNAPSHOT_SAVE_INTERVAL_MS);

			// Save an initial snapshot immediately
			void saveServerSnapshot(store, storeUrl, encryptionKey).catch(
				(error: unknown) =>
					logger.error('Failed to save initial server snapshot:', error),
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
			if (snapshotSaveInterval) {
				clearInterval(snapshotSaveInterval);
			}
			if (!synchronizer) return;
			void synchronizer.destroy();
		};
	}, [isHydrated, isLocalReady, room]);

	if (!isHydrated || !isLocalReady || !isSyncReady) {
		return <SplashScreen />;
	}

	return (
		<tinybaseContext.Provider value={{ store: storeRef.current }}>
			<Provider store={storeRef.current}>{children}</Provider>
		</tinybaseContext.Provider>
	);
}
