import type { MergeableStore } from 'tinybase';
import type {
	CellAddress,
	CellKeys,
	CellSync,
	CellSyncStateStore,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import PartySocket from 'partysocket';
import {
	applyCellsToStore,
	createCellSync,
	createIndexedDbCellSyncStateStore,
	fetchLegacySnapshot,
	flattenChanges,
	getCellKeys,
	hashRoomId,
	hasIncompletePull,
	INCOMPLETE_PULL_SUFFIX,
	isLocalValueId,
	LOCAL_VALUE_PREFIX,
	REJECTED_RETRY_MS,
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
// Pulls that stopped early (clock far behind, a cell that could not be
// decrypted) and failed legacy snapshot merges are retried after this.
const PULL_RETRY_DELAY_MS = 60_000;

/**
 * `error`: some changes cannot be synced for now (e.g. the device clock is far
 * off, or a cell could not be decrypted); they are retried.
 */
export type RoomSyncStatus = 'error' | 'offline' | 'synced' | 'syncing';

export interface StartRoomSyncOptions {
	/** Rows (`[table, row]` keys) not to upload, see `getRowKey`. */
	heldBackRows?: ReadonlySet<string>;
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
/** Identifies a row in `heldBackRows`. */
export function getRowKey(table: string, row: string): string {
	return JSON.stringify([table, row]);
}

export function startRoomSync({
	heldBackRows,
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
	let legacySnapshotEtagValueId: string | undefined;
	let legacyIncompleteValueId: string | undefined;
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
	let activeRun: Promise<void> | undefined;
	// Whether a pull must be repeated later, see PULL_RETRY_DELAY_MS.
	let pullRetryDue = false;

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

	/**
	 * Merges the snapshot of clients that still use the snapshot protocol. Its
	 * ETag is a local value of the store, so it is persisted with the merged
	 * content, and it is only recorded once all of the snapshot was applied.
	 * Returns false if the merge must be retried.
	 */
	const mergeLegacySnapshot = async () => {
		if (!storeUrl || !keys || !legacySnapshotEtagValueId) return true;
		const etagValueId = legacySnapshotEtagValueId;
		const etag = store.getValue(etagValueId);
		const result = await fetchLegacySnapshot(
			storeUrl,
			keys.encryptionKey,
			typeof etag === 'string' ? etag : undefined,
		);
		if (isDisposed || result.status === 'unchanged') return true;
		const cells = result.content
			? flattenChanges(result.content).filter(
					(cell) => !(cell.kind === 'v' && isLocalValueId(cell.cell)),
				)
			: [];
		// Cells the server is missing are uploaded by the next push.
		const { deferred } = applyCellsToStore(store, cells, ({ deferred }) => {
			// Saved with the applied cells, so migrations also skip the partial
			// rows after a restart.
			if (deferred.length > 0) {
				store.setValue(legacyIncompleteValueId!, true);
			} else {
				store.delValue(legacyIncompleteValueId!);
				if (result.etag) store.setValue(etagValueId, result.etag);
			}
		});
		await persistStore?.();
		if (deferred.length > 0) {
			logger.warn(
				`[SYNC] ${deferred.length} legacy snapshot cells wait for the device clock`,
			);
			return false;
		}
		return true;
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
				} catch (error) {
					needsPull = true;
					throw error;
				}
				if (isDisposed) return;
				let isLegacyMerged = false;
				try {
					isLegacyMerged = await mergeLegacySnapshot();
				} catch (error) {
					// It must not hold back uploads.
					logger.warn('[SYNC] Failed to merge the legacy snapshot:', error);
				}
				if (isDisposed) return;
				// Both are retried with a later pull.
				const pullRetry = cellSync.getPullRetry();
				if (pullRetry || !isLegacyMerged) {
					needsPull = true;
					pullRetryDue = true;
				}
				if (pullRetry === 'decrypt') {
					logger.warn('[SYNC] A pulled cell could not be decrypted, retrying');
				}

				// Migrations must see complete rows: on a partial row a migration
				// could, e.g., delete the row as invalid and sync that deletion.
				// Other rooms' incomplete pulls count too: their rows are in the
				// same store.
				if (!pullRetry && isLegacyMerged && !hasIncompletePull(store)) {
					// Run migrations and repair rows written by pre-profile clients
					// after merging remote data.
					await runMigrationsIfNeeded(store, { deviceId });
					repairMissingProfileIds(store);
				}
			}

			const { oversized, rejected } = await cellSync.push();
			if (rejected.length > 0 || oversized.length > 0) {
				logger.error(
					`[SYNC] ${rejected.length} cells rejected (check the device clock), ${oversized.length} too large: ${describeCells([...rejected, ...oversized])}`,
				);
			}

			failures = 0;
			if (cellSync.hasUnsyncableCells() || cellSync.getPullRetry()) {
				setStatus('error');
			} else {
				setStatus('synced');
			}
			// Rejected cells become uploadable again after a while.
			if (cellSync.hasUnsyncableCells() && !timer) {
				schedule(REJECTED_RETRY_MS);
			}
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
				} else if (pullRetryDue) {
					pullRetryDue = false;
					if (!timer || timerDueAt - Date.now() > PULL_RETRY_DELAY_MS) {
						schedule(PULL_RETRY_DELAY_MS);
					}
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
				if (result === 'gap') {
					needsPull = true;
					requestSoon();
				} else if (result === 'legacy') {
					// A client of the snapshot protocol saved; merge its snapshot.
					needsPull = true;
					requestSoon();
				} else if (result === 'deferred') {
					// The pull position stopped before cells that wait for the clock.
					needsPull = true;
					if (!timer) schedule(PULL_RETRY_DELAY_MS);
				}
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
		legacySnapshotEtagValueId = `${LOCAL_VALUE_PREFIX}sync:${roomHash}:legacySnapshotEtag`;
		legacyIncompleteValueId = `${LOCAL_VALUE_PREFIX}sync:${roomHash}:legacy:${INCOMPLETE_PULL_SUFFIX}`;
		const roomCellSync = createCellSync({
			cellsUrl: getRoomUrl(roomHash, 'cells'),
			holdBack: heldBackRows?.size
				? ({ kind, row, table }) =>
						kind === 't' && heldBackRows.has(getRowKey(table, row))
				: undefined,
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
			stateValuePrefix: `${LOCAL_VALUE_PREFIX}sync:${roomHash}:`,
			store,
		});
		try {
			await roomCellSync.init();
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

	let connectFailures = 0;
	let connectTimer: ReturnType<typeof setTimeout> | undefined;
	const connect = () => {
		void connectRoomSync().catch((error: unknown) => {
			// E.g. the sync state database could not be opened.
			stateStore?.close();
			stateStore = undefined;
			if (isDisposed) return;
			connectFailures += 1;
			const delay = getRetryDelay(connectFailures);
			logger.error(
				`[SYNC] Failed to connect room sync, retrying in ${Math.round(delay / 1000)}s:`,
				error,
			);
			setStatus('offline');
			connectTimer = setTimeout(connect, delay);
		});
	};
	connect();

	return async () => {
		isDisposed = true;
		if (timer) {
			clearTimeout(timer);
		}
		if (connectTimer) {
			clearTimeout(connectTimer);
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
