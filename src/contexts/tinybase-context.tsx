'use client';

import type { MergeableStore } from 'tinybase';
import type { Persister } from 'tinybase/persisters';
import type { RoomSyncStatus } from '@/lib/tinybase-sync/room-sync';
import { fbt } from 'fbtee';
import { useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createMergeableStore } from 'tinybase';
import {
	applyCellsToStore,
	flattenChanges,
	hasIncompletePull,
	INCOMPLETE_PULL_SUFFIX,
	LOCAL_VALUE_PREFIX,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { Provider } from 'tinybase/ui-react';
import { SplashScreen } from '@/components/splash-screen';
import { logger } from '@/lib/logger';
import { resolvePartykitHost } from '@/lib/partykit-host';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { cloneRoomData } from '@/lib/tinybase-sync/cloning';
import { STORE_VALUE_SELECTED_PROFILE_ID } from '@/lib/tinybase-sync/constants';
import {
	backupLocalStore,
	deleteObsoleteLocalDatabases,
	onLocalDataReset,
	resetLocalData,
} from '@/lib/tinybase-sync/factory-reset';
import { getLocalDbName } from '@/lib/tinybase-sync/local-store-id';
import { getRowKey, startRoomSync } from '@/lib/tinybase-sync/room-sync';
import { isStoreDataEmpty } from '@/lib/tinybase-sync/store-utils';
import { repairMissingProfileIds } from '@/migrations/2026-06-05-consolidate-duplicate-profiles';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getDeviceId } from '@/utils/device-id';
import { DataSynchronizationContext } from './data-synchronization-context';
import { RoomSyncStatusContext } from './room-sync-status-context';

const defaultStore = createMergeableStore();
const LOCAL_LOAD_ATTEMPTS = 3;
const LOCAL_LOAD_RETRY_DELAY_MS = 250;

type LocalPersistenceProblem = 'load' | 'save';

// Marks rows recovered only in part from a rejected local database, so
// migrations skip them (see hasIncompletePull).
const LOCAL_RECOVERY_INCOMPLETE_VALUE_ID = `${LOCAL_VALUE_PREFIX}recovery:${INCOMPLETE_PULL_SUFFIX}`;

function isMissingObjectStore(error: unknown): boolean {
	return error instanceof DOMException && error.name === 'NotFoundError';
}

interface TinybaseProviderProps {
	children: React.ReactNode;
}

async function clonePreviewDataIfEmpty(
	store: MergeableStore,
	persister: Persister,
): Promise<void> {
	if (
		process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' &&
		process.env.NEXT_PUBLIC_MAIN_ROOM_NAME &&
		isStoreDataEmpty(store)
	) {
		try {
			await cloneRoomData(
				process.env.NEXT_PUBLIC_MAIN_ROOM_NAME,
				resolvePartykitHost({ vercelEnv: 'production' }),
				store,
			);
			await persister.save();
			logger.log('Auto-cloned data from production in preview environment');
		} catch (error) {
			logger.error('Failed to auto-clone data from production:', error);
		}
	}
}

export function TinybaseProvider({ children }: TinybaseProviderProps) {
	const { isHydrated, joinStrategy, leaveRoom, resetJoinStrategy, room } =
		useContext(DataSynchronizationContext);
	const joinStrategyRef = useRef(joinStrategy);
	joinStrategyRef.current = joinStrategy;
	const storeRef = useRef<MergeableStore>(defaultStore);
	const persisterRef = useRef<Persister | undefined>(undefined);
	// False while the local database must not be written, see loadLocalStore.
	const canSaveLocallyRef = useRef(false);
	// Rows recovered only in part from a rejected local database; they are not
	// uploaded, so other devices can't take them as complete.
	const partlyRecoveredRowsRef = useRef(new Set<string>());
	// Resolves once the previous room's sync has stopped.
	const roomSyncStoppedRef = useRef<Promise<void>>(Promise.resolve());
	const [isLocalReady, setIsLocalReady] = useState(false);
	const [syncStatus, setSyncStatus] = useState<RoomSyncStatus | undefined>();
	const [persistenceProblem, setPersistenceProblem] = useState<
		LocalPersistenceProblem | undefined
	>();

	useEffect(() => {
		let isDisposed = false;

		const store = storeRef.current;
		// TinyBase persisters report failures here instead of rejecting.
		let lastPersisterError: unknown;
		let isLoaded = false;
		const localPersister = createIndexedDbPersister(
			store,
			getLocalDbName(),
			undefined,
			(error: unknown) => {
				// The first load on a new device finds no object stores: nothing
				// was saved yet, which is not a failed read.
				if (!isLoaded && isMissingObjectStore(error)) return;
				lastPersisterError = error;
				logger.error('Local store persister error:', error);
				if (isLoaded && !isDisposed) setPersistenceProblem('save');
			},
		);

		const loadLocalStore = async () => {
			for (let attempt = 1; ; attempt += 1) {
				lastPersisterError = undefined;
				await localPersister.load();
				if (lastPersisterError === undefined) break;
				if (attempt === LOCAL_LOAD_ATTEMPTS) return false;
				await new Promise((resolve) =>
					setTimeout(resolve, LOCAL_LOAD_RETRY_DELAY_MS * attempt),
				);
			}
			if (flattenChanges(store.getMergeableContent()).length > 0) return true;
			// A MergeableStore silently ignores all persisted content if one
			// timestamp is more than 5 minutes ahead of the clock, e.g. written
			// while the clock was ahead. Check with a store that accepts any
			// time, and keep the database until the clock has caught up.
			const probe = createMergeableStore(
				'probe',
				() => Number.MAX_SAFE_INTEGER,
			);
			let probeError: unknown;
			const probePersister = createIndexedDbPersister(
				probe,
				getLocalDbName(),
				undefined,
				(error: unknown) => {
					if (!isMissingObjectStore(error)) probeError = error;
				},
			);
			await probePersister.load();
			await probePersister.destroy();
			// A failed re-read must not be mistaken for an empty database.
			if (probeError !== undefined) return false;
			const persistedCells = flattenChanges(probe.getMergeableContent());
			if (persistedCells.length === 0) return true;
			applyCellsToStore(store, persistedCells, ({ deferred }) => {
				// Rows may be partial; this flag is never saved, as nothing is.
				if (deferred.length > 0) {
					store.setValue(LOCAL_RECOVERY_INCOMPLETE_VALUE_ID, true);
				}
				for (const { kind, row, table } of deferred) {
					if (kind === 't') {
						partlyRecoveredRowsRef.current.add(getRowKey(table, row));
					}
				}
			});
			return false;
		};

		const initialize = async () => {
			void deleteObsoleteLocalDatabases();
			const startLoad = performance.now();
			isLoaded = await loadLocalStore();
			logger.log(
				`[PERF] Local IndexedDB load took ${(performance.now() - startLoad).toFixed(2)}ms`,
			);

			if (isLoaded) {
				canSaveLocallyRef.current = true;
				await clonePreviewDataIfEmpty(store, localPersister);
				await localPersister.startAutoSave();
			} else {
				// Saving would overwrite the data that could not be read with an
				// empty store. Run from memory until the next start instead.
				logger.error('Failed to load the local store; not saving locally');
				if (!isDisposed) setPersistenceProblem('load');
			}

			const localSelectedProfileId = store.getValue(
				STORE_VALUE_SELECTED_PROFILE_ID,
			);
			if (
				typeof localSelectedProfileId === 'string' &&
				!getItem(STORAGE_KEYS.SELECTED_PROFILE_ID)
			) {
				setItem(STORAGE_KEYS.SELECTED_PROFILE_ID, localSelectedProfileId);
			}

			const startMigrations = performance.now();
			// Rows of a room that was only partly pulled may be incomplete, and
			// a migration could delete them as invalid.
			if (hasIncompletePull(store)) {
				logger.warn('Skipping migrations until the room sync is complete');
			} else {
				await runMigrationsIfNeeded(store, { deviceId: getDeviceId() });
				repairMissingProfileIds(store);
			}
			logger.log(
				`[PERF] Initial local migrations took ${(performance.now() - startMigrations).toFixed(2)}ms`,
			);

			if (!isDisposed) {
				setIsLocalReady(true);
			}
		};

		void initialize().catch((error: unknown) => {
			logger.error('Failed to initialize local store:', error);
			if (!isDisposed) {
				setIsLocalReady(true);
			}
		});

		// Another tab switched to a fresh local store: stop saving this tab's
		// store and load the new one.
		const stopListeningToResets = onLocalDataReset(() => {
			void localPersister.stopAutoSave().finally(() => {
				window.location.reload();
			});
		});

		persisterRef.current = localPersister;
		return () => {
			isDisposed = true;
			stopListeningToResets();
			persisterRef.current = undefined;
			void localPersister.stopAutoSave();
			void localPersister.destroy();
		};
	}, []);

	useEffect(() => {
		if (!isHydrated || !isLocalReady) {
			return;
		}

		if (!room) {
			setSyncStatus(undefined);
			return;
		}

		let isCancelled = false;
		let stopRoomSync: (() => Promise<void>) | undefined;
		const previousRoomSyncStopped = roomSyncStoppedRef.current;

		const start = async () => {
			// Never let two room syncs work on the store at the same time.
			await previousRoomSyncStopped;
			if (isCancelled) return;

			if (joinStrategyRef.current === 'clear') {
				// Join with a fresh local store. Deleting the local rows instead
				// would sync the deletions into the room.
				try {
					await backupLocalStore(storeRef.current);
				} catch (error) {
					// The local data stays as it is; don't join without a backup.
					logger.error('Failed to back up before clearing:', error);
					// Another room was chosen meanwhile; leave that one alone.
					if (isCancelled) return;
					toast.error(
						fbt(
							'The data on this device could not be backed up, so the room was not joined.',
							'Error shown when joining a room and clearing local data fails because the backup failed',
						),
					);
					leaveRoom();
					return;
				}
				await persisterRef.current?.stopAutoSave();
				resetLocalData();
				setItem(STORAGE_KEYS.ROOM, room);
				setItem(STORAGE_KEYS.ROOM_JOIN_STRATEGY, 'merge');
				window.location.reload();
				return;
			}
			resetJoinStrategy();

			// Sync runs in the background. The app always renders from local data,
			// so an unreachable relay never blocks it.
			stopRoomSync = startRoomSync({
				heldBackRows: partlyRecoveredRowsRef.current,
				onStatusChange: setSyncStatus,
				// The sync keeps its pull position in the store, so a failed save
				// only causes cells to be pulled again.
				// Nothing is saved over a local database that could not be read.
				persistStore: async () => {
					if (!canSaveLocallyRef.current) return;
					await persisterRef.current?.save();
				},
				room,
				store: storeRef.current,
			});
		};

		const started = start().catch((error: unknown) => {
			logger.error('Failed to start room sync:', error);
		});
		return () => {
			isCancelled = true;
			roomSyncStoppedRef.current = started.then(() => stopRoomSync?.());
			setSyncStatus(undefined);
		};
	}, [isHydrated, isLocalReady, leaveRoom, resetJoinStrategy, room]);

	useEffect(() => {
		if (!isLocalReady || !persistenceProblem) return;
		toast.error(
			persistenceProblem === 'load'
				? fbt(
						'Your data could not be loaded from this device. Changes are not saved on this device until the app is reopened.',
						'Error shown when the data stored on the device cannot be read',
					)
				: fbt(
						'Changes could not be saved on this device.',
						'Error shown when changes cannot be saved in the storage of the device',
					),
		);
	}, [isLocalReady, persistenceProblem]);

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

	if (!isHydrated || !isLocalReady) {
		return <SplashScreen />;
	}

	return (
		<Provider store={storeRef.current}>
			<RoomSyncStatusContext.Provider value={syncStatus}>
				{children}
			</RoomSyncStatusContext.Provider>
		</Provider>
	);
}
