import type { MergeableStore } from 'tinybase';
import type { Synchronizer } from 'tinybase/synchronizers';
import type { JoinStrategy } from '@/contexts/data-synchronization-context';
import PartySocket from 'partysocket';
import {
	createEncryptedPartyKitSynchronizer,
	getEncryptionKey,
	getStoreUrl,
	hashRoomId,
	loadServerSnapshot,
	saveServerSnapshot,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { logger } from '@/lib/logger';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import { TINYBASE_PARTYKIT_PARTY } from '@/lib/tinybase-sync/constants';
import { repairMissingProfileIds } from '@/migrations/2026-06-05-consolidate-duplicate-profiles';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getDeviceId } from '@/utils/device-id';

const SNAPSHOT_SAVE_INTERVAL_MS = 30_000;

export interface StartRoomSyncOptions {
	joinStrategy: JoinStrategy;
	onJoinStrategyApplied: () => void;
	onReady: () => void;
	room: string;
	store: MergeableStore;
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

export function startRoomSync({
	joinStrategy,
	onJoinStrategyApplied,
	onReady,
	room,
	store,
}: StartRoomSyncOptions): () => void {
	let isDisposed = false;
	let synchronizer: Synchronizer | undefined;
	let connection: PartySocket | undefined;
	let handleOpen: (() => void) | undefined;
	let snapshotSaveInterval: ReturnType<typeof setInterval> | undefined;
	let storeListenerId: string | undefined;
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let isBootstrapping = false;

	const deviceId = getDeviceId();
	const initialJoinStrategy = joinStrategy;

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

		const saveSnapshot = (reason: string) => {
			if (connection?.readyState !== 1) return;
			void saveServerSnapshot(store, storeUrl, encryptionKey).catch(
				(error: unknown) => logger.error(reason, error),
			);
		};

		// Debounced snapshot save: triggered by any store change while online.
		// Keeps the server snapshot up-to-date within ~1 second so that peers
		// coming back online see the latest data even within the 30s interval.
		const scheduleSave = () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(() => {
				if (isDisposed) return;
				saveSnapshot('Failed to save debounced snapshot:');
			}, 1000);
		};

		// Fetches the server snapshot, CRDT-merges it into the local store,
		// then saves the merged result back so peers can benefit from the
		// combined state (important when we had local changes while offline).
		const bootstrap = async (isInitial = false) => {
			if (isBootstrapping) return false;
			isBootstrapping = true;
			try {
				if (isInitial && initialJoinStrategy === 'clear') {
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

				if (isInitial) {
					// After initial merge/clear, revert to overwrite for subsequent reconnects.
					// Note: 'merge' is already handled by loadServerSnapshot because
					// applyMergeableChanges merges the remote state into the existing
					// local store.
					onJoinStrategyApplied();
				}

				// Run migrations and repair rows written by pre-profile clients after
				// merging remote data.
				await runMigrationsIfNeeded(store, { deviceId });
				repairMissingProfileIds(store);

				if (didLoad) {
					// Push the merged state back so other clients can pick it up.
					saveSnapshot('Failed to save snapshot after bootstrap:');
				}
				return didLoad;
			} catch (error) {
				logger.error('Failed to load server snapshot:', error);
				if (isInitial) {
					throw error;
				}
				return false;
			} finally {
				isBootstrapping = false;
			}
		};

		// Initial bootstrap: load + merge the server snapshot before we start sync.
		// This runs before we register the reconnect listener so migrations always
		// complete before the synchronizer starts.
		const didLoadInitialSnapshot = await bootstrap(true);

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

		// Start CRDT sync in the background. A room may have no online peers,
		// so waiting for a peer response here would keep the splash screen up
		// even though the persisted snapshot loaded successfully.
		void synchronizer!.startSync().catch((error: unknown) => {
			logger.error('Failed to start synchronizer:', error);
		});

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
		snapshotSaveInterval = setInterval(() => {
			saveSnapshot('Failed to save periodic server snapshot:');
		}, SNAPSHOT_SAVE_INTERVAL_MS);

		// Save immediately when this is a new room. Existing snapshots are
		// already saved after bootstrap with the merged local state.
		if (!didLoadInitialSnapshot) {
			saveSnapshot('Failed to save initial server snapshot:');
		}

		if (!isDisposed) {
			onReady();
		}
	};

	void connectRoomSync().catch((error) => {
		logger.error('[SYNC] Failed to connect room sync:', error);
		// Fail closed: rendering an empty store here would show the profile
		// prompt and could let this client overwrite an established room.
		// Keep the splash screen visible and never start snapshot saving.
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
}
