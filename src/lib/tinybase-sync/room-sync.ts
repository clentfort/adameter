import type { MergeableStore } from 'tinybase';
import type {
	CellAddress,
	CellKeys,
	CellSync,
	CellSyncStateStore,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import PartySocket from 'partysocket';
import {
	createCellSync,
	createIndexedDbCellSyncStateStore,
	fetchLegacySnapshot,
	getCellKeys,
	hashRoomId,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { logger } from '@/lib/logger';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import {
	getRoomSyncStateDbName,
	TINYBASE_PARTYKIT_PARTY,
} from '@/lib/tinybase-sync/constants';
import { getLocalStoreId } from '@/lib/tinybase-sync/local-store-id';
import { repairMissingProfileIds } from '@/migrations/2026-06-05-consolidate-duplicate-profiles';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getDeviceId } from '@/utils/device-id';

const SAVE_DEBOUNCE_MS = 1000;
// Continuous changes delay an upload by at most this long.
const SAVE_MAX_WAIT_MS = 5000;
// Retries after a failed request back off exponentially so that an
// unreachable or rate-limited relay is not hammered by open tabs.
const RETRY_BASE_DELAY_MS = 5000;
const RETRY_MAX_DELAY_MS = 10 * 60_000;
// Reconnects shorten a pending backoff to at most this delay. A relay that
// accepts and drops connections in a loop is still contacted rarely.
const RECONNECT_RETRY_DELAY_MS = 10_000;
const SOCKET_MAX_RECONNECTION_DELAY_MS = 60_000;
const CELLS_PROTOCOL = 'cells';

/**
 * `error`: some local changes cannot be synced (e.g. the device clock is far
 * ahead); they are kept on this device.
 */
export type RoomSyncStatus = 'error' | 'offline' | 'synced' | 'syncing';

export interface StartRoomSyncOptions {
	onStatusChange?: (status: RoomSyncStatus) => void;
	/** Resolves once the local persister has saved the store. */
	persistStore?: () => Promise<void>;
	room: string;
	store: MergeableStore;
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

function getRoomUrl(roomHash: string, path: string): string {
	const protocol =
		PARTYKIT_HOST.startsWith('localhost') ||
		PARTYKIT_HOST.startsWith('127.0.0.1')
			? 'http'
			: 'https';
	return `${protocol}://${PARTYKIT_HOST}/parties/${TINYBASE_PARTYKIT_PARTY}/${roomHash}/${path}`;
}

function getBatchCellLimit(): number | undefined {
	// Lets e2e tests exercise interrupted multi-batch uploads.
	const limit = Number(process.env.NEXT_PUBLIC_SYNC_BATCH_CELLS);
	return Number.isSafeInteger(limit) && limit > 0 ? limit : undefined;
}

function describeCells(cells: readonly CellAddress[]): string {
	// Locations only; values never leave the device unencrypted.
	return cells
		.slice(0, 10)
		.map(({ cell, row, table }) => (table ? `${table}/${row}/${cell}` : cell))
		.join(', ');
}

/**
 * Syncs the local store with a room in the background.
 *
 * The local store is the source of truth and stays usable at all times. The
 * relay merges encrypted cells by HLC: local changes are uploaded as single
 * cells, and changes of other devices arrive over a WebSocket or are pulled
 * by sequence number after a reconnect. Requests run only when something
 * changed and back off while the relay is unreachable.
 *
 * Returns a function that stops syncing and resolves once running work has
 * finished. Results that arrive after that are not applied.
 */
export function startRoomSync({
	onStatusChange,
	persistStore,
	room,
	store,
}: StartRoomSyncOptions): () => Promise<void> {
	let isDisposed = false;
	let connection: PartySocket | undefined;
	let cellSync: CellSync | undefined;
	let stateStore: CellSyncStateStore | undefined;
	let keys: CellKeys | undefined;
	let storeUrl: string | undefined;
	let legacySnapshotEtag: string | undefined;
	let hasOpened = false;

	// Whether changes of other devices may be missing locally. True initially,
	// after every reconnect, and after a missed broadcast.
	let needsPull = true;
	let failures = 0;
	let isRunning = false;
	let shouldRunAgain = false;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let timerDueAt = 0;
	let saveRequestedAt: number | undefined;
	let status: RoomSyncStatus | undefined;
	let hasUnsyncableCells = false;
	let activeRun: Promise<void> | undefined;

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

	/** Merges the snapshot of clients that still use the snapshot protocol. */
	const mergeLegacySnapshot = async () => {
		if (!storeUrl || !keys || !stateStore) return;
		const result = await fetchLegacySnapshot(
			storeUrl,
			keys.encryptionKey,
			legacySnapshotEtag,
		);
		if (isDisposed || result.status === 'unchanged') return;
		if (result.content) {
			// Cells the server is missing are uploaded by the next push.
			store.applyMergeableChanges(result.content);
			await persistStore?.();
		}
		if (isDisposed || !result.etag) return;
		legacySnapshotEtag = result.etag;
		await stateStore.save({ legacySnapshotEtag: result.etag });
	};

	const run = async () => {
		if (isDisposed || !cellSync) return;
		if (isRunning) {
			shouldRunAgain = true;
			return;
		}
		if (!needsPull && !cellSync.hasPendingUploads()) return;
		if (isBrowserOffline()) {
			// The `online` listener resumes syncing.
			setStatus('offline');
			return;
		}

		isRunning = true;
		activeRun = sync(cellSync);
		await activeRun;
	};

	const sync = async (cellSync: CellSync) => {
		saveRequestedAt = undefined;
		setStatus('syncing');
		try {
			// Always pull before pushing, so migrations see remote data first.
			if (needsPull) {
				needsPull = false;
				try {
					const startPull = performance.now();
					const { applied } = await cellSync.pull();
					logger.log(
						`[PERF] Cell pull took ${(performance.now() - startPull).toFixed(2)}ms (applied=${applied})`,
					);
					if (isDisposed) return;
					await mergeLegacySnapshot();
				} catch (error) {
					needsPull = true;
					throw error;
				}
				if (isDisposed) return;

				// Run migrations and repair rows written by pre-profile clients after
				// merging remote data.
				await runMigrationsIfNeeded(store, { deviceId });
				repairMissingProfileIds(store);
			}

			const { oversized, rejected } = await cellSync.push();
			if (rejected.length > 0 || oversized.length > 0) {
				hasUnsyncableCells = true;
				logger.error(
					`[SYNC] ${rejected.length} cells rejected (check the device clock), ${oversized.length} too large: ${describeCells([...rejected, ...oversized])}`,
				);
			}

			failures = 0;
			setStatus(hasUnsyncableCells ? 'error' : 'synced');
		} catch (error) {
			if (isDisposed) return;
			failures += 1;
			const delay = getRetryDelay(failures);
			logger.warn(
				`[SYNC] Cell sync failed, retrying in ${Math.round(delay / 1000)}s:`,
				error,
			);
			setStatus('offline');
			schedule(delay);
		} finally {
			isRunning = false;
			if (!isDisposed && failures === 0) {
				if (shouldRunAgain || cellSync.hasPendingUploads()) {
					scheduleSave();
				}
			}
			shouldRunAgain = false;
		}
	};

	const handleStoreChange = () => {
		// Empty transactions (e.g. setting a value to its current value) must not
		// restart the debounce.
		const [changedTables, changedValues] = store.getTransactionChanges();
		if (
			Object.keys(changedTables).length === 0 &&
			Object.keys(changedValues).length === 0
		) {
			return;
		}
		if (!cellSync?.hasPendingUploads()) return;
		// While backing off, the pending retry also uploads the new content.
		if (failures === 0) {
			scheduleSave();
		}
	};

	const handleMessage = (event: MessageEvent) => {
		if (typeof event.data !== 'string' || !cellSync) return;
		void cellSync
			.receive(event.data)
			.then((result) => {
				if (result !== 'gap') return;
				needsPull = true;
				requestSoon();
			})
			.catch((error: unknown) => {
				logger.warn('[SYNC] Failed to apply cell broadcast, pulling:', error);
				needsPull = true;
				requestSoon();
			});
	};

	const handleOpen = () => {
		if (hasOpened) {
			logger.log('[SYNC] WebSocket reconnected, pulling changed cells');
		}
		hasOpened = true;
		// Broadcasts sent while the socket was closed are missed, including
		// those between the first pull and the first open.
		needsPull = true;
		requestSoon();
	};

	const handleOnline = () => {
		needsPull = true;
		requestSoon();
	};

	const handleOffline = () => {
		setStatus('offline');
	};

	let storeListenerId: string | undefined;
	if (typeof window !== 'undefined') {
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);
	}
	setStatus(isBrowserOffline() ? 'offline' : 'syncing');

	const connectRoomSync = async () => {
		const [roomHash, roomKeys] = await Promise.all([
			hashRoomId(room),
			getCellKeys(room),
		]);
		if (isDisposed) return;

		keys = roomKeys;
		storeUrl = getRoomUrl(roomHash, 'store');
		stateStore = createIndexedDbCellSyncStateStore(
			getRoomSyncStateDbName(getLocalStoreId(), roomHash),
		);
		const roomCellSync = createCellSync({
			cellsUrl: getRoomUrl(roomHash, 'cells'),
			keys: roomKeys,
			limits: { batchCells: getBatchCellLimit() },
			onIgnoredError: (error) => {
				logger.warn(
					'[SYNC] Skipped a cell that could not be decrypted:',
					error,
				);
			},
			persistStore,
			state: stateStore,
			store,
		});
		try {
			await roomCellSync.init();
			legacySnapshotEtag = (await stateStore.load()).legacySnapshotEtag;
		} catch (error) {
			await roomCellSync.dispose();
			throw error;
		}
		if (isDisposed) {
			await roomCellSync.dispose();
			return;
		}
		cellSync = roomCellSync;
		// Registered after the cell sync's own listener, so it sees the cells
		// that the transaction queued for upload.
		storeListenerId = store.addDidFinishTransactionListener(handleStoreChange);

		connection = new PartySocket({
			host: PARTYKIT_HOST,
			maxReconnectionDelay: SOCKET_MAX_RECONNECTION_DELAY_MS,
			party: TINYBASE_PARTYKIT_PARTY,
			query: { protocol: CELLS_PROTOCOL },
			room: roomHash,
		});
		connection.addEventListener('open', handleOpen);
		connection.addEventListener('message', handleMessage);

		void run();
	};

	void connectRoomSync().catch((error: unknown) => {
		logger.error('[SYNC] Failed to connect room sync:', error);
		setStatus('offline');
	});

	return async () => {
		isDisposed = true;
		if (timer) {
			clearTimeout(timer);
		}
		if (storeListenerId) store.delListener(storeListenerId);
		if (typeof window !== 'undefined') {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		}
		connection?.removeEventListener('open', handleOpen);
		connection?.removeEventListener('message', handleMessage);
		connection?.close();
		await activeRun?.catch(() => {});
		await cellSync?.dispose();
		stateStore?.close();
	};
}
