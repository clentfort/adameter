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

const SAVE_DEBOUNCE_MS = 1000;
// Continuous changes delay a save by at most this long.
const SAVE_MAX_WAIT_MS = 5000;
// Retries after a failed snapshot request back off exponentially so that an
// unreachable or rate-limited relay is not hammered by open tabs.
const RETRY_BASE_DELAY_MS = 5000;
const RETRY_MAX_DELAY_MS = 10 * 60_000;
// Reconnects shorten a pending backoff to at most this delay. A relay that
// accepts and drops connections in a loop is still contacted rarely.
const RECONNECT_RETRY_DELAY_MS = 10_000;
const SOCKET_MAX_RECONNECTION_DELAY_MS = 60_000;

export type RoomSyncStatus = 'offline' | 'synced' | 'syncing';

export interface StartRoomSyncOptions {
	joinStrategy: JoinStrategy;
	onJoinStrategyApplied: () => void;
	onStatusChange?: (status: RoomSyncStatus) => void;
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

function getRetryDelay(failures: number): number {
	const delay = Math.min(
		RETRY_MAX_DELAY_MS,
		RETRY_BASE_DELAY_MS * 2 ** (failures - 1),
	);
	return delay * (0.5 + Math.random() / 2);
}

function isBrowserOffline(): boolean {
	return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/**
 * Syncs the local store with a room in the background.
 *
 * The local store is the source of truth and stays usable at all times. The
 * relay is used opportunistically: real-time sync with online peers over a
 * WebSocket, and an encrypted snapshot for peers that are not online at the
 * same time. Snapshot requests run only when the local content changed or
 * after a reconnect, and back off while the relay is unreachable.
 */
export function startRoomSync({
	joinStrategy,
	onJoinStrategyApplied,
	onStatusChange,
	room,
	store,
}: StartRoomSyncOptions): () => void {
	let isDisposed = false;
	let synchronizer: Synchronizer | undefined;
	let connection: PartySocket | undefined;
	let storeUrl: string | undefined;
	let encryptionKey: CryptoKey | undefined;
	let hasOpened = false;

	// Whether the server snapshot must be merged before the next save. True
	// initially and after every reconnect, as peers may have saved meanwhile.
	let needsLoad = true;
	// Whether local content may be missing from the server snapshot. The save
	// itself is skipped when the content hashes already match the server.
	let needsSave = true;
	let failures = 0;
	let isRunning = false;
	let shouldRunAgain = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let timerDueAt = 0;
	let saveRequestedAt: number | undefined;
	let status: RoomSyncStatus | undefined;

	const deviceId = getDeviceId();

	const setStatus = (nextStatus: RoomSyncStatus) => {
		if (isDisposed || status === nextStatus) return;
		status = nextStatus;
		onStatusChange?.(nextStatus);
	};

	const schedule = (delay: number) => {
		if (isDisposed) return;
		if (timer) clearTimeout(timer);
		timerDueAt = Date.now() + delay;
		timer = setTimeout(() => {
			timer = undefined;
			void run();
		}, delay);
	};

	const scheduleSave = () => {
		const now = Date.now();
		saveRequestedAt ??= now;
		schedule(
			Math.max(
				0,
				Math.min(SAVE_DEBOUNCE_MS, saveRequestedAt + SAVE_MAX_WAIT_MS - now),
			),
		);
	};

	// Brings a pending retry forward, e.g. after the network came back.
	const requestSoon = () => {
		const delay = failures === 0 ? 0 : RECONNECT_RETRY_DELAY_MS;
		if (!timer || timerDueAt - Date.now() > delay) {
			schedule(delay);
		}
	};

	const run = async () => {
		if (isDisposed || !storeUrl || !encryptionKey) return;
		if (isRunning) {
			shouldRunAgain = true;
			return;
		}
		if (!needsLoad && !needsSave) return;
		if (isBrowserOffline()) {
			// The `online` listener resumes syncing.
			setStatus('offline');
			return;
		}

		isRunning = true;
		saveRequestedAt = undefined;
		setStatus('syncing');
		try {
			if (needsLoad) {
				const startLoad = performance.now();
				const didLoad = await loadServerSnapshot(
					store,
					storeUrl,
					encryptionKey,
				);
				logger.log(
					`[PERF] Server snapshot load took ${(performance.now() - startLoad).toFixed(2)}ms (loaded=${didLoad})`,
				);
				needsLoad = false;
				if (isDisposed) return;

				// Run migrations and repair rows written by pre-profile clients after
				// merging remote data.
				await runMigrationsIfNeeded(store, { deviceId });
				repairMissingProfileIds(store);
			}

			if (needsSave) {
				needsSave = false;
				try {
					await saveServerSnapshot(store, storeUrl, encryptionKey);
				} catch (error) {
					needsSave = true;
					throw error;
				}
			}

			failures = 0;
			setStatus('synced');
		} catch (error) {
			failures += 1;
			const delay = getRetryDelay(failures);
			logger.warn(
				`[SYNC] Snapshot sync failed, retrying in ${Math.round(delay / 1000)}s:`,
				error,
			);
			setStatus('offline');
			schedule(delay);
		} finally {
			isRunning = false;
			if (shouldRunAgain && !isDisposed) {
				shouldRunAgain = false;
				if (failures === 0) {
					scheduleSave();
				}
			}
		}
	};

	const handleStoreChange = () => {
		const [changedTables, changedValues] = store.getTransactionChanges();
		if (
			Object.keys(changedTables).length === 0 &&
			Object.keys(changedValues).length === 0
		) {
			return;
		}

		needsSave = true;
		// While backing off, the pending retry also saves the new content.
		if (failures === 0) {
			scheduleSave();
		}
	};

	const handleOpen = () => {
		if (hasOpened) {
			logger.log('[SYNC] WebSocket reconnected, reloading server snapshot');
			needsLoad = true;
			needsSave = true;
		}
		hasOpened = true;
		requestSoon();
	};

	const handleOnline = () => {
		needsLoad = true;
		needsSave = true;
		requestSoon();
	};

	const handleOffline = () => {
		setStatus('offline');
	};

	if (joinStrategy === 'clear') {
		store.setContent([{}, {}]);
	}
	// Apply the strategy only once. Reapplying 'clear' on a later start would
	// discard entries made since joining.
	onJoinStrategyApplied();

	const storeListenerId =
		store.addDidFinishTransactionListener(handleStoreChange);
	if (typeof window !== 'undefined') {
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
	}
	setStatus(isBrowserOffline() ? 'offline' : 'syncing');

	const connectRoomSync = async () => {
		const [hashedRoomId, roomEncryptionKey] = await Promise.all([
			hashRoomId(room),
			getEncryptionKey(room),
		]);
		if (isDisposed) return;

		connection = new PartySocket({
			host: PARTYKIT_HOST,
			maxReconnectionDelay: SOCKET_MAX_RECONNECTION_DELAY_MS,
			party: TINYBASE_PARTYKIT_PARTY,
			room: hashedRoomId,
		});
		connection.addEventListener('open', handleOpen);
		storeUrl = getStoreUrl(connection);
		encryptionKey = roomEncryptionKey;

		void run();

		// Real-time sync with online peers. It is independent of the snapshot:
		// peers can exchange changes even when snapshot requests fail.
		let lastPeerWaitLogTimestamp = 0;
		const roomSynchronizer = await createEncryptedPartyKitSynchronizer(
			store,
			connection,
			roomEncryptionKey,
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
			await roomSynchronizer.destroy();
			return;
		}
		synchronizer = roomSynchronizer;

		void synchronizer.startSync().catch((error: unknown) => {
			logger.error('Failed to start synchronizer:', error);
		});
	};

	void connectRoomSync().catch((error: unknown) => {
		logger.error('[SYNC] Failed to connect room sync:', error);
		setStatus('offline');
	});

	return () => {
		isDisposed = true;
		if (timer) {
			clearTimeout(timer);
		}
		store.delListener(storeListenerId);
		if (typeof window !== 'undefined') {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		}
		connection?.removeEventListener('open', handleOpen);
		if (synchronizer) {
			void synchronizer.destroy();
			return;
		}
		connection?.close();
	};
}
