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
	CURRENT_SCHEMA_VERSION,
	STORE_VALUE_SCHEMA_VERSION,
	TABLE_IDS,
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

function getErrorMessage(error: unknown): string {
	if (typeof error === 'string') {
		return error;
	}
	if (error instanceof Error) {
		return error.message;
	}
	return String(error);
}

function isExpectedSynchronizerTimeout(error: unknown): boolean {
	const message = getErrorMessage(error);
	return message.startsWith('No response from');
}

interface BaselineMetrics {
	profileCount: number;
	profileLinkedRows: number;
	totalRows: number;
}

function calculateMetrics(store: MergeableStore): BaselineMetrics {
	let totalRows = 0;
	let profileLinkedRows = 0;
	const profileCount = store.getRowIds(TABLE_IDS.PROFILES).length;

	for (const tableId of store.getTableIds()) {
		const rowIds = store.getRowIds(tableId);
		totalRows += rowIds.length;

		// Count profile links only for known domain tables
		if (
			Object.values(TABLE_IDS).includes(tableId as string) &&
			tableId !== TABLE_IDS.PROFILES
		) {
			for (const rowId of rowIds) {
				if (store.hasCell(tableId, rowId, 'profileId')) {
					profileLinkedRows++;
				}
			}
		}
	}

	return { profileCount, profileLinkedRows, totalRows };
}

export function TinybaseProvider({ children }: TinybaseProviderProps) {
	const { isHydrated, joinStrategy, resetJoinStrategy, room } = useContext(
		DataSynchronizationContext,
	);
	const storeRef = useRef<MergeableStore>(defaultStore);
	const baselineMetricsRef = useRef<BaselineMetrics | null>(null);
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
		let handleOpen: (() => void) | undefined;
		let snapshotSaveInterval: ReturnType<typeof setInterval> | undefined;
		let storeListenerId: string | undefined;
		let debounceTimer: ReturnType<typeof setTimeout> | undefined;
		let isBootstrapping = false;

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

			// Debounced snapshot save: triggered by any store change while online.
			// Keeps the server snapshot up-to-date within ~1 second so that peers
			// coming back online see the latest data even within the 30s interval.
			const isSnapshotSaveSafe = () => {
				// Don't overwrite a newer schema version from a stale client
				const currentSchemaVersion = store.getValue(STORE_VALUE_SCHEMA_VERSION);
				if (
					typeof currentSchemaVersion === 'number' &&
					currentSchemaVersion > CURRENT_SCHEMA_VERSION
				) {
					logger.error(
						`[SYNC] Snapshot save blocked: remote schema version (${currentSchemaVersion}) is newer than client supported version (${CURRENT_SCHEMA_VERSION}).`,
					);
					return false;
				}

				const baseline = baselineMetricsRef.current;
				if (!baseline) return true;

				const current = calculateMetrics(store);

				// If baseline had substantial data (>= 50 rows)
				if (baseline.totalRows >= 50) {
					// Block if lost > 50% total rows
					if (current.totalRows < baseline.totalRows * 0.5) {
						logger.error(
							`[SYNC] Snapshot save blocked: suspicious data loss. Baseline total: ${baseline.totalRows}, current: ${current.totalRows}`,
						);
						return false;
					}
					// Block if lost > 50% profile-linked rows
					if (current.profileLinkedRows < baseline.profileLinkedRows * 0.5) {
						logger.error(
							`[SYNC] Snapshot save blocked: suspicious profile data loss. Baseline profile-linked: ${baseline.profileLinkedRows}, current: ${current.profileLinkedRows}`,
						);
						return false;
					}
				}

				return true;
			};

			const wrappedSaveServerSnapshot = async (reason: string) => {
				if (!isSnapshotSaveSafe()) {
					return;
				}
				try {
					await saveServerSnapshot(store, storeUrl, encryptionKey);
				} catch (error) {
					logger.error(`Failed to save snapshot (${reason}):`, error);
				}
			};

			const scheduleSave = () => {
				if (debounceTimer) clearTimeout(debounceTimer);
				debounceTimer = setTimeout(() => {
					if (isDisposed || connection?.readyState !== 1) return;
					void wrappedSaveServerSnapshot('debounced');
				}, 1000);
			};

			// Fetches the server snapshot, CRDT-merges it into the local store,
			// then saves the merged result back so peers can benefit from the
			// combined state (important when we had local changes while offline).
			const bootstrap = async (isInitial = false) => {
				if (isBootstrapping) return;
				isBootstrapping = true;
				try {
					if (isInitial && joinStrategy === 'clear') {
						store.setContent([{}, {}]);
					}

					const startBootstrap = performance.now();
					const didLoad = await loadServerSnapshot(
						store,
						storeUrl,
						encryptionKey,
					);
					logger.log(
						`[PERF] Server snapshot bootstrap took ${(performance.now() - startBootstrap).toFixed(2)}ms (loaded=${didLoad})`,
					);

					if (isDisposed) return;

					// Establish baseline metrics immediately after loading the remote snapshot,
					// before we run migrations or any normalization that could strip fields locally.
					// This ensures the guardrail has a "remote-truth" baseline to compare against.
					if (didLoad) {
						baselineMetricsRef.current = calculateMetrics(store);
					}

					if (isInitial) {
						// After initial merge/clear, revert to overwrite for subsequent reconnects.
						// Note: 'merge' is already handled by loadServerSnapshot because
						// applyMergeableChanges merges the remote state into the existing
						// local store.
						resetJoinStrategy();
					}

					// Check schema compatibility before running migrations or saving snapshots
					const remoteSchemaVersion = store.getValue(
						STORE_VALUE_SCHEMA_VERSION,
					);
					if (
						typeof remoteSchemaVersion === 'number' &&
						remoteSchemaVersion > CURRENT_SCHEMA_VERSION
					) {
						logger.warn(
							`[SYNC] Remote schema version (${remoteSchemaVersion}) is newer than client version (${CURRENT_SCHEMA_VERSION}). Sync may be restricted.`,
						);
						// We don't block sync entirely yet, but we avoid saving snapshots
						// that might downgrade the remote schema metadata.
					}

					// Run migrations after merging remote data
					await runMigrationsIfNeeded(store, { deviceId });

					if (didLoad) {
						// Push the merged state back so other clients can pick it up.
						void wrappedSaveServerSnapshot('bootstrap');
					}
				} catch (error) {
					logger.error('Failed to load server snapshot:', error);
				} finally {
					isBootstrapping = false;
				}
			};

			// Initial bootstrap: load + merge the server snapshot before we start sync.
			// This runs before we register the reconnect listener so migrations always
			// complete before the synchronizer starts.
			await bootstrap(true);

			if (isDisposed) return;

			storeListenerId = store.addDidFinishTransactionListener(() => {
				scheduleSave();
			});

			if (isDisposed) return;

			// Create the encrypted synchronizer for real-time sync
			let lastPeerWaitLogTimestamp = 0;
			synchronizer = await createEncryptedPartyKitSynchronizer(
				store,
				connection,
				encryptionKey,
				(error: unknown) => {
					if (isExpectedSynchronizerTimeout(error)) {
						const now = Date.now();
						if (now - lastPeerWaitLogTimestamp >= 30_000) {
							logger.info('Synchronizer waiting for peers:', error);
							lastPeerWaitLogTimestamp = now;
						}
						return;
					}
					logger.error('Synchronizer error:', error);
				},
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

			// Re-bootstrap whenever the WebSocket reconnects.  PartySocket
			// auto-reconnects after network drops; on each reconnect we re-fetch
			// the server snapshot so we pick up changes from peers that were
			// online while we were offline.  We register this listener only
			// after the initial setup is complete so migrations always finish
			// before the synchronizer starts.
			handleOpen = () => {
				logger.log(
					'[SYNC] WebSocket reconnected, re-bootstrapping from server snapshot...',
				);
				void bootstrap(false);
			};
			connection.addEventListener('open', handleOpen);

			// Periodically save an encrypted snapshot so that future clients
			// can bootstrap when no peers are online.
			const SNAPSHOT_SAVE_INTERVAL_MS = 30_000;
			snapshotSaveInterval = setInterval(() => {
				if (connection?.readyState === 1) {
					void wrappedSaveServerSnapshot('periodic');
				}
			}, SNAPSHOT_SAVE_INTERVAL_MS);

			// Save an initial snapshot immediately so that the first device to
			// join a room persists its local data for future peers.
			void wrappedSaveServerSnapshot('initial');

			if (!isDisposed) {
				setIsSyncReady(true);
			}
		};

		void connectRoomSync().catch((error) => {
			logger.error('[SYNC] Failed to connect room sync:', error);
			if (!isDisposed) {
				setIsSyncReady(true);
			}
		});

		return () => {
			isDisposed = true;
			if (snapshotSaveInterval) {
				clearInterval(snapshotSaveInterval);
			}
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
			if (connection && handleOpen) {
				connection.removeEventListener('open', handleOpen);
			}
			if (storeListenerId) {
				store.delListener(storeListenerId);
			}
			if (!synchronizer) {
				if (connection) connection.close();
				return;
			}
			void synchronizer.destroy();
		};
	}, [isHydrated, isLocalReady, joinStrategy, resetJoinStrategy, room]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const isDevelopment = process.env.NODE_ENV === 'development';
			const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
			const isTest = (window as unknown as { __E2E_TESTS__?: boolean })
				.__E2E_TESTS__;

			if (isDevelopment || isPreview || isTest) {
				Object.assign(window, {
					tinybaseLocalReady: isLocalReady,
					tinybaseStore: storeRef.current,
				});
			}
		}
	}, [isLocalReady]);

	if (!isHydrated || !isLocalReady || !isSyncReady) {
		return <SplashScreen />;
	}

	return (
		<tinybaseContext.Provider value={{ store: storeRef.current }}>
			<Provider store={storeRef.current}>{children}</Provider>
		</tinybaseContext.Provider>
	);
}
