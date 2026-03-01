'use client';

import type { Store } from 'tinybase';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createStore } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { createPartyKitPersister } from 'tinybase/persisters/persister-partykit-client';
import { Provider } from 'tinybase/ui-react';
import { SplashScreen } from '@/components/splash-screen';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import {
	logPerformanceEvent,
	startPerformanceTimer,
} from '@/lib/performance-logging';
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
			const loadTimer = startPerformanceTimer(
				'tinybase.persistence.local.load',
			);
			await localPersister.load();
			loadTimer.end();

			await localPersister.startAutoSave();

			await runMigrationsIfNeeded(store, { deviceId: getDeviceId() });

			if (!isDisposed) {
				setIsLocalReady(true);
			}
		};

		void initialize().catch((error) => {
			logPerformanceEvent('tinybase.persistence.local.failed', {
				metadata: {
					error: String(error),
				},
			});

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
			logPerformanceEvent('sync.partykit.reconnected', {
				metadata: { room },
			});
			void loadRemoteAndApplyMigrations().catch((error) => {
				logPerformanceEvent('sync.partykit.provider.error', {
					metadata: {
						error: String(error),
						room,
					},
				});
			});
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				logPerformanceEvent('sync.partykit.visibility_visible', {
					metadata: { room },
				});
				connection?.reconnect();
				void loadRemoteAndApplyMigrations().catch((error) => {
					logPerformanceEvent('sync.partykit.provider.error', {
						metadata: {
							error: String(error),
							room,
						},
					});
				});
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
				(error) => {
					logPerformanceEvent('sync.partykit.provider.error', {
						metadata: {
							error: String(error),
							room,
						},
					});
				},
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

			logPerformanceEvent('tinybase.persistence.remote.bootstrap', {
				metadata: {
					decision: bootstrapResult.decision,
					localHadData: bootstrapResult.localHadData,
					migrationsApplied: migrationResult.appliedMigrationIds.join(','),
					remoteHadData: bootstrapResult.remoteHadData,
					room,
				},
			});

			const connectTimer = startPerformanceTimer('sync.partykit.connect', {
				room,
			});
			await remotePersister.startAutoPersisting(undefined, false);
			connectTimer.end();

			logPerformanceEvent('sync.partykit.provider.created', {
				metadata: { room },
			});

			if (!isDisposed) {
				setIsSyncReady(true);
			}
		};

		void connectRoomSync().catch((error) => {
			logPerformanceEvent('sync.partykit.provider.failed', {
				metadata: {
					error: String(error),
					room,
				},
			});

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

			logPerformanceEvent('sync.partykit.provider.destroyed', {
				metadata: { room },
			});
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
