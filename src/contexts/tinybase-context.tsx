'use client';

import type { Store } from 'tinybase';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createStore } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { createPartyKitPersister } from 'tinybase/persisters/persister-partykit-client';
import { IndexeddbPersistence } from 'y-indexeddb';
import YPartyKitProvider from 'y-partykit/provider';
import { Doc } from 'yjs';
import { SplashScreen } from '@/components/splash-screen';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import {
	logPerformanceEvent,
	startPerformanceTimer,
} from '@/lib/performance-logging';
import {
	LEGACY_YJS_PARTYKIT_PARTY,
	TINYBASE_LOCAL_DB_NAME,
	TINYBASE_PARTYKIT_PARTY,
} from '@/lib/tinybase-sync/constants';
import {
	completeLegacyMigrationMarker,
	ensureLegacyMigrationMarker,
	migrateStoreFromLegacyYjsDoc,
} from '@/lib/tinybase-sync/legacy-yjs-migration';
import {
	reconcileRemoteLoadResult,
	snapshotStoreContentIfNonEmpty,
} from '@/lib/tinybase-sync/remote-bootstrap';
import { DataSynchronizationContext } from './data-synchronization-context';

const defaultStore = createStore();

export const tinybaseContext = createContext<{ store: Store }>({
	store: defaultStore,
});

interface TinybaseProviderProps {
	children: React.ReactNode;
}

export function TinybaseProvider({ children }: TinybaseProviderProps) {
	const { room } = useContext(DataSynchronizationContext);
	const storeRef = useRef<Store>(defaultStore);
	const [isReady, setIsReady] = useState(false);

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

			const migrationResult = await migrateFromLocalLegacyYjs(store);
			if (migrationResult === 'migrated') {
				await localPersister.save();
			}

			await localPersister.startAutoSave();

			if (!isDisposed) {
				setIsReady(true);
			}
		};

		void initialize().catch((error) => {
			logPerformanceEvent('tinybase.persistence.local.failed', {
				metadata: {
					error: String(error),
				},
			});

			if (!isDisposed) {
				setIsReady(true);
			}
		});

		return () => {
			isDisposed = true;
			void localPersister.stopAutoSave();
			void localPersister.destroy();
		};
	}, []);

	useEffect(() => {
		if (!isReady || !room) {
			return;
		}

		let isDisposed = false;
		const store = storeRef.current;
		let remotePersister: ReturnType<typeof createPartyKitPersister> | undefined;

		const connectRoomSync = async () => {
			const migrationTimer = startPerformanceTimer('tinybase.migration.party', {
				room,
			});
			await migrateRoomFromLegacyYjs(store, room);
			migrationTimer.end();

			if (isDisposed) {
				return;
			}

			const connection = new PartySocket({
				host: PARTYKIT_HOST,
				party: TINYBASE_PARTYKIT_PARTY,
				room,
			});

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
			const bootstrapResult = reconcileRemoteLoadResult(store, localSnapshot);

			if (bootstrapResult.decision === 'restore-local') {
				await remotePersister.save();
			}

			logPerformanceEvent('tinybase.persistence.remote.bootstrap', {
				metadata: {
					decision: bootstrapResult.decision,
					localHadData: bootstrapResult.localHadData,
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
		};

		void connectRoomSync().catch((error) => {
			logPerformanceEvent('sync.partykit.provider.failed', {
				metadata: {
					error: String(error),
					room,
				},
			});
		});

		return () => {
			isDisposed = true;
			if (!remotePersister) {
				return;
			}

			logPerformanceEvent('sync.partykit.provider.destroyed', {
				metadata: { room },
			});
			void remotePersister.stopAutoPersisting(true);
			void remotePersister.destroy();
		};
	}, [isReady, room]);

	if (!isReady) {
		return <SplashScreen />;
	}

	return (
		<tinybaseContext.Provider value={{ store: storeRef.current }}>
			{children}
		</tinybaseContext.Provider>
	);
}

async function migrateFromLocalLegacyYjs(store: Store) {
	const doc = new Doc();
	const persistence = new IndexeddbPersistence('adameter', doc);

	try {
		await persistence.whenSynced;
		const migrationResult = migrateStoreFromLegacyYjsDoc(store, doc, {
			source: 'yjs-local',
		});

		logPerformanceEvent('tinybase.migration.local.result', {
			metadata: {
				reason: migrationResult.reason,
			},
		});

		return migrationResult.reason;
	} finally {
		await persistence.destroy();
		doc.destroy();
	}
}

async function migrateRoomFromLegacyYjs(store: Store, room: string) {
	const doc = new Doc();
	const persistence = new IndexeddbPersistence('adameter', doc);
	let provider: YPartyKitProvider | undefined;

	try {
		await persistence.whenSynced;

		provider = new YPartyKitProvider(PARTYKIT_HOST, room, doc, {
			connect: true,
			party: LEGACY_YJS_PARTYKIT_PARTY,
		});

		await waitForYjsProviderSynced(provider);

		ensureLegacyMigrationMarker(doc, {
			actorId:
				typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
					? crypto.randomUUID()
					: `migration-${Date.now().toString(36)}`,
		});

		const migrationResult = migrateStoreFromLegacyYjsDoc(store, doc, {
			source: 'yjs-party',
		});

		completeLegacyMigrationMarker(doc);

		logPerformanceEvent('tinybase.migration.party.result', {
			metadata: {
				reason: migrationResult.reason,
				room,
			},
		});
	} finally {
		provider?.destroy();
		await persistence.destroy();
		doc.destroy();
	}
}

function waitForYjsProviderSynced(
	provider: YPartyKitProvider,
	timeoutMs = 10_000,
) {
	if (provider.synced) {
		return Promise.resolve(true);
	}

	return new Promise<boolean>((resolve) => {
		let settled = false;
		const onSynced = (isSynced: unknown) => {
			if (settled || isSynced !== true) {
				return;
			}

			settled = true;
			clearTimeout(timeoutId);
			provider.off('synced', onSynced);
			resolve(true);
		};

		const timeoutId = setTimeout(() => {
			if (settled) {
				return;
			}

			settled = true;
			provider.off('synced', onSynced);
			resolve(false);
		}, timeoutMs);

		provider.on('synced', onSynced);
	});
}
