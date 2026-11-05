import type { MergeableStore } from 'tinybase';
import type { CellSyncStateStore } from './cell-sync-state';
import type { CellAddress, CellKeys, EncryptedCell, PlainCell } from './cells';
import {
	applyCellsToStore,
	decryptCell,
	encryptCells,
	flattenChanges,
	getCellKey,
} from './cells';

/** Server limits; uploads stay below them. */
export const MAX_BATCH_CELLS = 500;
export const MAX_BATCH_BYTES = 512 * 1024;
export const MAX_CELL_BYTES = 64 * 1024;
export const PAGE_CELLS = 1000;

const REQUEST_TIMEOUT_MS = 15_000;
// Cells that could not be decrypted are fetched again in requests of this many.
const SEQS_PER_REQUEST = 100;
// Room for the JSON array brackets and separators of a batch.
const BATCH_OVERHEAD_BYTES = 1024;
// Cells of this table are uploaded first. Rows arrive cell by cell, so a
// device that pulls part of an upload must not run migrations on the rows it
// has; with the markers it skips them, and the remaining rows arrive in the
// uploader's migrated form.
const MIGRATIONS_TABLE = '_migrations';
/** Suffix of the local value that marks an incomplete pull, see below. */
export const INCOMPLETE_PULL_SUFFIX = 'incomplete';

/**
 * Whether any room's last pull of this store stopped early (cells that wait
 * for the clock or could not be decrypted), so some rows may be partial.
 * Migrations must not run on such a store.
 */
export function hasIncompletePull(store: MergeableStore): boolean {
	return store
		.getValueIds()
		.some(
			(valueId) =>
				isLocalValueId(valueId) &&
				valueId.endsWith(INCOMPLETE_PULL_SUFFIX) &&
				store.getValue(valueId) === true,
		);
}
/**
 * Values with IDs starting with this prefix belong to this device: they are
 * never uploaded and never taken from the server.
 */
export const LOCAL_VALUE_PREFIX = '_local:';

export function isLocalValueId(valueId: string): boolean {
	return valueId.startsWith(LOCAL_VALUE_PREFIX);
}

/** Cells rejected by the server (e.g. a clock far ahead) are retried after this. */
export const REJECTED_RETRY_MS = 5 * 60_000;

/** A cells request that reached the server but was rejected. */
export class CellRequestError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = 'CellRequestError';
		this.status = status;
	}
}

interface StoredCell extends EncryptedCell {
	seq: number;
}

interface CellsPage {
	cells: StoredCell[];
	epoch?: string;
	head: number;
	/** Whether further cells follow; older servers omit it. */
	more?: boolean;
}

export interface CellSyncLimits {
	batchBytes?: number;
	batchCells?: number;
	pageCells?: number;
}

export interface CellSyncOptions {
	/** `https://<host>/parties/<party>/<room>/cells` */
	cellsUrl: string;
	/**
	 * Local cells not to upload for now, e.g. rows only partly recovered: other
	 * devices could take them as complete and migrate them away.
	 */
	holdBack?: (cell: CellAddress) => boolean;
	keys: CellKeys;
	limits?: CellSyncLimits;
	onIgnoredError?: (error: unknown) => void;
	/** Resolves once the store's own persister has saved pulled cells. */
	persistStore?: () => Promise<void>;
	state: CellSyncStateStore;
	/**
	 * Prefix of local values (see {@link LOCAL_VALUE_PREFIX}) of the store that
	 * hold the last pulled sequence number and the server's epoch. As part of
	 * the store, they are persisted together with the cells they describe,
	 * whatever happens to the store's database. Without it, they are kept in
	 * memory only.
	 */
	stateValuePrefix?: string;
	store: MergeableStore;
}

export interface PushResult {
	/** Cells above the server's size limit. They are kept locally only. */
	oversized: CellAddress[];
	/** Cells the server rejected, e.g. because of a clock far ahead. */
	rejected: CellAddress[];
	uploaded: number;
}

/**
 * `deferred`: some cells wait for the clock or could not be decrypted; pull
 * again later. `legacy`: the legacy snapshot changed.
 */
export type ReceiveResult =
	'applied' | 'deferred' | 'gap' | 'ignored' | 'legacy';

export interface CellSync {
	/** Stops listening to the store and waits for running work. */
	dispose(): Promise<void>;
	/**
	 * Why the last pull stopped before the server's head, if it did: `clock`
	 * when cells wait for this device's clock, which is too far behind for the
	 * store to accept them; `decrypt` when a cell could not be decrypted. Pull
	 * again later.
	 */
	getPullRetry(): 'clock' | 'decrypt' | undefined;
	hasPendingUploads(): boolean;
	/** Whether local cells are kept back because they cannot be uploaded. */
	hasUnsyncableCells(): boolean;
	/** Loads the persisted state and finds local cells the server may lack. */
	init(): Promise<void>;
	/** Fetches all cells changed on the server since the last pull. */
	pull(): Promise<{ applied: number }>;
	/** Uploads local cells that are newer than the server's. */
	push(): Promise<PushResult>;
	/** Applies a WebSocket broadcast if it directly follows the last pull. */
	receive(message: string): Promise<ReceiveResult>;
}

function toAddress({ cell, kind, row, table }: CellAddress): CellAddress {
	return { cell, kind, row, table };
}

function isNewer(hlc: string, than: string | undefined): boolean {
	return than === undefined || hlc > than;
}

function isStoredCell(candidate: unknown): candidate is StoredCell {
	if (candidate === null || typeof candidate !== 'object') return false;
	const { cell, data, hlc, kind, row, seq, table } = candidate as Record<
		string,
		unknown
	>;
	return (
		(kind === 't' || kind === 'v') &&
		typeof table === 'string' &&
		typeof row === 'string' &&
		typeof cell === 'string' &&
		typeof hlc === 'string' &&
		typeof data === 'string' &&
		typeof seq === 'number'
	);
}

async function readError(response: Response): Promise<string> {
	try {
		return (await response.text()) || response.statusText;
	} catch {
		return response.statusText;
	}
}

async function getCellsJson(url: URL): Promise<CellsPage> {
	const response = await fetch(url, {
		cache: 'no-store',
		mode: 'cors',
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	if (!response.ok) {
		throw new CellRequestError(
			`Cells GET failed (${response.status}): ${await readError(response)}`,
			response.status,
		);
	}
	const page = (await response.json()) as Partial<CellsPage>;
	if (
		!Array.isArray(page.cells) ||
		!page.cells.every(isStoredCell) ||
		typeof page.head !== 'number'
	) {
		throw new CellRequestError('Invalid cells page', response.status);
	}
	return page as CellsPage;
}

/** Splits cells into batches below the count and byte limits. */
export function batchCells(
	cells: readonly EncryptedCell[],
	maxCells: number,
	maxBytes: number,
): EncryptedCell[][] {
	// Keep the cells of a row together, in the order rows first appear, so
	// other devices don't receive a row in parts; only a row above the limits
	// is split.
	const rows = new Map<string, EncryptedCell[]>();
	for (const cell of cells) {
		const rowKey = JSON.stringify([cell.kind, cell.table, cell.row]);
		const row = rows.get(rowKey);
		if (row) row.push(cell);
		else rows.set(rowKey, [cell]);
	}

	const batches: EncryptedCell[][] = [];
	let batch: EncryptedCell[] = [];
	let bytes = BATCH_OVERHEAD_BYTES;
	const flush = () => {
		if (batch.length > 0) batches.push(batch);
		batch = [];
		bytes = BATCH_OVERHEAD_BYTES;
	};
	for (const row of rows.values()) {
		const rowBytes = row.reduce(
			(total, cell) => total + JSON.stringify(cell).length + 1,
			0,
		);
		if (
			batch.length > 0 &&
			(batch.length + row.length > maxCells || bytes + rowBytes > maxBytes)
		) {
			flush();
		}
		for (const cell of row) {
			const cellBytes = JSON.stringify(cell).length + 1;
			if (
				batch.length > 0 &&
				(batch.length >= maxCells || bytes + cellBytes > maxBytes)
			) {
				flush();
			}
			batch.push(cell);
			bytes += cellBytes;
		}
	}
	flush();
	return batches;
}

/**
 * Syncs a MergeableStore with the per-cell endpoints of the relay.
 *
 * The server is the sync partner of every device: local cells newer than what
 * the server is known to have are uploaded, and cells the server accepted
 * since the last pull are fetched by sequence number. Values are encrypted
 * per cell; the server merges them by HLC without reading them.
 *
 * All operations run one after another. Results that arrive after `dispose`
 * are not applied.
 */
export function createCellSync({
	cellsUrl,
	holdBack,
	keys,
	limits = {},
	onIgnoredError,
	persistStore,
	state,
	stateValuePrefix,
	store,
}: CellSyncOptions): CellSync {
	const batchCellLimit = limits.batchCells ?? MAX_BATCH_CELLS;
	const batchByteLimit = limits.batchBytes ?? MAX_BATCH_BYTES;
	const pageCells = limits.pageCells ?? PAGE_CELLS;
	if (stateValuePrefix !== undefined && !isLocalValueId(stateValuePrefix)) {
		throw new Error(`stateValuePrefix must start with ${LOCAL_VALUE_PREFIX}`);
	}
	const lastSeqValueId = stateValuePrefix && `${stateValuePrefix}lastSeq`;
	const epochValueId = stateValuePrefix && `${stateValuePrefix}epoch`;
	const missingValueId = stateValuePrefix && `${stateValuePrefix}missing`;
	const incompleteValueId =
		stateValuePrefix && `${stateValuePrefix}${INCOMPLETE_PULL_SUFFIX}`;

	let lastSeq = 0;
	let stamps = new Map<string, string>();
	// Local cells that may be missing on the server, by cell key.
	const pending = new Map<string, PlainCell>();
	// Cells that cannot be uploaded (rejected by the server or too large), by
	// cell key. Retried once the cell changes or `retryAt` has passed.
	const rejected = new Map<string, { hlc: string; retryAt: number }>();
	let serverEpoch: string | undefined;
	let pullRetry: 'clock' | 'decrypt' | undefined;
	// Sequence numbers of pulled cells that could not be decrypted. They are
	// fetched again by sequence number until they can be, without holding back
	// the rest of the room.
	let missingSeqs = new Set<number>();
	let isDisposed = false;
	let queue: Promise<unknown> = Promise.resolve();

	const exclusive = <Result>(operation: () => Promise<Result>) => {
		const result = queue.then(operation);
		queue = result.catch(() => {});
		return result;
	};

	const isLocalCell = (cell: PlainCell) =>
		cell.kind === 'v' && isLocalValueId(cell.cell);

	const trackLocalCell = (cell: PlainCell) => {
		if (isLocalCell(cell)) return;
		const key = getCellKey(cell);
		if (!isNewer(cell.hlc, stamps.get(key))) return;
		if (!isNewer(cell.hlc, pending.get(key)?.hlc)) return;
		pending.set(key, cell);
	};

	const scanStore = () => {
		pending.clear();
		for (const cell of flattenChanges(store.getMergeableContent())) {
			trackLocalCell(cell);
		}
	};

	const listenerId = store.addDidFinishTransactionListener(() => {
		for (const cell of flattenChanges(store.getTransactionMergeableChanges())) {
			trackLocalCell(cell);
		}
	});

	// Call within a store transaction, together with the cells they cover.
	const setLastSeq = (nextSeq: number) => {
		lastSeq = nextSeq;
		if (lastSeqValueId) store.setValue(lastSeqValueId, nextSeq);
	};

	const setServerEpoch = (epoch: string | undefined) => {
		serverEpoch = epoch;
		if (!epochValueId) return;
		if (epoch === undefined) store.delValue(epochValueId);
		else store.setValue(epochValueId, epoch);
	};

	const setMissingSeqs = (seqs: Set<number>) => {
		missingSeqs = seqs;
		if (!missingValueId) return;
		if (seqs.size === 0) store.delValue(missingValueId);
		else store.setValue(missingValueId, JSON.stringify([...seqs]));
	};

	const readState = () => {
		if (!lastSeqValueId || !epochValueId || !missingValueId) return;
		const seq = store.getValue(lastSeqValueId);
		lastSeq =
			typeof seq === 'number' && Number.isSafeInteger(seq) && seq > 0 ? seq : 0;
		const epoch = store.getValue(epochValueId);
		serverEpoch = typeof epoch === 'string' ? epoch : undefined;
		const missing = store.getValue(missingValueId);
		try {
			const parsed: unknown =
				typeof missing === 'string' ? JSON.parse(missing) : [];
			missingSeqs = new Set(
				Array.isArray(parsed)
					? parsed.filter((value): value is number =>
							Number.isSafeInteger(value),
						)
					: [],
			);
		} catch {
			missingSeqs = new Set();
		}
	};

	const recordServerStamp = (cell: CellAddress & { hlc: string }) => {
		const key = getCellKey(cell);
		if (isNewer(cell.hlc, stamps.get(key))) stamps.set(key, cell.hlc);
		const local = pending.get(key);
		if (local && !isNewer(local.hlc, stamps.get(key))) pending.delete(key);
		return [key, stamps.get(key)!] as [string, string];
	};

	const decryptAll = async (cells: readonly StoredCell[]) => {
		const decrypted: (PlainCell & { seq: number })[] = [];
		const failedSeqs: number[] = [];
		for (let start = 0; start < cells.length; start += 500) {
			const chunk = cells.slice(start, start + 500);
			const results = await Promise.allSettled(
				chunk.map((cell) => decryptCell(keys, cell)),
			);
			for (const [index, result] of results.entries()) {
				if (result.status === 'fulfilled') {
					decrypted.push({ ...result.value, seq: chunk[index].seq });
				} else {
					// Never stamped, and fetched again later.
					onIgnoredError?.(result.reason);
					failedSeqs.push(chunk[index].seq);
				}
			}
		}
		return { decrypted, failedSeqs };
	};

	/**
	 * Applies cells from the server and persists the new state. `nextSeq` is
	 * the pull position the cells take it to, if they were pulled by position.
	 * `requestedSeqs` are missing cells that were fetched again; those the
	 * server no longer has under that number were replaced by newer cells.
	 * `isPartial` tells that more pages follow. Returns the number of applied
	 * cells and whether some wait for the clock.
	 */
	const applyServerCells = async (
		cells: readonly StoredCell[],
		{
			isPartial = false,
			nextSeq,
			requestedSeqs = [],
		}: {
			isPartial?: boolean;
			nextSeq?: number;
			requestedSeqs?: readonly number[];
		},
	) => {
		const { decrypted: all, failedSeqs } = await decryptAll(cells);
		const decrypted = all.filter((cell) => !isLocalCell(cell));
		if (isDisposed) return { applied: 0, isDeferred: false };

		// Record the stamps of the cells the store accepts first, so the store
		// listener does not queue them for upload. Cells the store can never
		// accept are recorded too, so they don't block the room.
		let updatedStamps: [string, string][] = [];
		const result = applyCellsToStore(store, decrypted, (outcome) => {
			updatedStamps = [...outcome.applied, ...outcome.invalid].map(
				recordServerStamp,
			);
			const missing = new Set(missingSeqs);
			const returnedSeqs = new Set(cells.map((cell) => cell.seq));
			for (const seq of requestedSeqs) {
				if (!returnedSeqs.has(seq)) missing.delete(seq);
			}
			for (const cell of [...outcome.applied, ...outcome.invalid]) {
				missing.delete(cell.seq);
			}
			for (const seq of failedSeqs) missing.add(seq);
			if (missing.size !== missingSeqs.size || failedSeqs.length > 0) {
				setMissingSeqs(missing);
			}
			// The pull position must not pass cells that wait for the clock;
			// they are pulled again later. It changes together with the cells.
			if (nextSeq !== undefined) {
				const deferredSeqs = outcome.deferred.map((cell) => cell.seq);
				const appliedSeq =
					deferredSeqs.length > 0 ? Math.min(...deferredSeqs) - 1 : nextSeq;
				if (appliedSeq > lastSeq) setLastSeq(appliedSeq);
			}
			// Saved with the cells: if the app stops before the pull completes,
			// the next start knows that rows may be partial. Only a complete pull
			// clears it.
			const leavesPartialRows =
				isPartial || outcome.deferred.length > 0 || missing.size > 0;
			if (incompleteValueId && cells.length > 0 && leavesPartialRows) {
				store.setValue(incompleteValueId, true);
			}
		});
		for (const cell of result.invalid) {
			onIgnoredError?.(
				new Error(`Cell ${getCellKey(cell)} cannot be stored and was skipped`),
			);
		}
		const isDeferred = result.deferred.length > 0;
		await persistStore?.();
		if (isDisposed) return { applied: 0, isDeferred };
		await state.save({ epoch: serverEpoch, stamps: updatedStamps });
		return { applied: result.applied.length, isDeferred };
	};

	/** Fetches missing cells again; see `missingSeqs`. */
	const retryMissingCells = async () => {
		let isDeferred = false;
		const seqs = [...missingSeqs].sort((first, second) => first - second);
		for (let start = 0; start < seqs.length; start += SEQS_PER_REQUEST) {
			const requestedSeqs = seqs.slice(start, start + SEQS_PER_REQUEST);
			const url = new URL(cellsUrl);
			for (const seq of requestedSeqs)
				url.searchParams.append('seq', String(seq));
			const page = await getCellsJson(url);
			if (isDisposed) return isDeferred;
			const result = await applyServerCells(page.cells, { requestedSeqs });
			isDeferred ||= result.isDeferred;
		}
		return isDeferred;
	};

	const fetchPage = (since: number): Promise<CellsPage> => {
		const url = new URL(cellsUrl);
		url.searchParams.set('since', String(since));
		url.searchParams.set('limit', String(pageCells));
		return getCellsJson(url);
	};

	/**
	 * Forgets what the server is known to have, so everything is uploaded and
	 * pulled again. The server stamps are cleared first: if the app stops
	 * before the new sequence number and epoch are persisted, the old epoch
	 * triggers the reset again.
	 */
	const resetServerState = async (epoch: string | undefined) => {
		stamps = new Map();
		await state.clear(epoch);
		store.transaction(() => {
			setLastSeq(0);
			setServerEpoch(epoch);
			setMissingSeqs(new Set());
		});
		await persistStore?.();
		scanStore();
	};

	/**
	 * Tracks the server's epoch of the room. Returns true if it changed, i.e.
	 * the server lost or reset the room's cells and the state was reset.
	 */
	const updateServerEpoch = async (epoch: string | undefined) => {
		if (epoch === undefined || epoch === serverEpoch) return false;
		if (serverEpoch === undefined) {
			store.transaction(() => setServerEpoch(epoch));
			return false;
		}
		await resetServerState(epoch);
		return true;
	};

	const pullPages = async () => {
		let applied = 0;
		for (;;) {
			const page = await fetchPage(lastSeq);
			if (isDisposed) return { applied, isDeferred: false };
			if (await updateServerEpoch(page.epoch)) continue;
			// Fewer cells than this device pulled or uploaded: the room's storage
			// was lost or reset.
			if (page.head < lastSeq || (page.head === 0 && stamps.size > 0)) {
				await resetServerState(page.epoch);
				continue;
			}
			const isLastPage =
				page.more === undefined ? page.cells.length < pageCells : !page.more;
			const nextSeq = isLastPage ? page.head : page.cells.at(-1)!.seq;
			const result = await applyServerCells(page.cells, {
				isPartial: !isLastPage,
				nextSeq,
			});
			applied += result.applied;
			if (isDisposed || isLastPage || result.isDeferred) {
				return { applied, isDeferred: result.isDeferred };
			}
		}
	};

	const pull = async () => {
		const { applied, isDeferred } = await pullPages();
		const isMissingDeferred =
			missingSeqs.size > 0 && !isDisposed && (await retryMissingCells());
		pullRetry =
			isDeferred || isMissingDeferred
				? 'clock'
				: missingSeqs.size > 0
					? 'decrypt'
					: undefined;
		// Kept with the store, so migrations at the next start see it too.
		if (incompleteValueId && !isDisposed) {
			const id = incompleteValueId;
			const isIncomplete = pullRetry !== undefined;
			if (isIncomplete !== (store.getValue(id) === true)) {
				store.transaction(() => {
					if (isIncomplete) store.setValue(id, true);
					else store.delValue(id);
				});
				await persistStore?.();
			}
		}
		return { applied };
	};

	interface PostResult {
		/** Sequence numbers of the accepted cells, if any were accepted. */
		accepted?: { fromSeq: number; toSeq: number };
		epoch?: string;
		rejected: CellAddress[];
	}

	const postBatch = async (
		batch: readonly EncryptedCell[],
	): Promise<PostResult> => {
		const response = await fetch(cellsUrl, {
			body: JSON.stringify(batch),
			cache: 'no-store',
			headers: { 'Content-Type': 'application/json' },
			method: 'POST',
			mode: 'cors',
			signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		});
		if (response.status === 422) {
			const body = (await response.json()) as { rejected?: CellAddress[] };
			return { rejected: (body.rejected ?? []).map(toAddress) };
		}
		if (!response.ok) {
			throw new CellRequestError(
				`Cells POST failed (${response.status}): ${await readError(response)}`,
				response.status,
			);
		}
		const { epoch, fromSeq, toSeq } = (await response.json()) as {
			epoch?: unknown;
			fromSeq?: unknown;
			toSeq?: unknown;
		};
		return {
			accepted:
				typeof fromSeq === 'number' && typeof toSeq === 'number'
					? { fromSeq, toSeq }
					: undefined,
			epoch: typeof epoch === 'string' ? epoch : undefined,
			rejected: [],
		};
	};

	const isKeptBack = (key: string, cell: PlainCell, now: number) => {
		const rejection = rejected.get(key);
		return rejection?.hlc === cell.hlc && now < rejection.retryAt;
	};

	const getOutbox = (now = Date.now()) =>
		[...pending.entries()]
			.filter(
				([key, cell]) =>
					isNewer(cell.hlc, stamps.get(key)) &&
					!isKeptBack(key, cell, now) &&
					!holdBack?.(cell),
			)
			.map(([, cell]) => cell)
			// Stable sort: migration markers first, see MIGRATIONS_TABLE.
			.sort(
				(first, second) =>
					Number(second.table === MIGRATIONS_TABLE) -
					Number(first.table === MIGRATIONS_TABLE),
			);

	const push = async (): Promise<PushResult> => {
		const result: PushResult = { oversized: [], rejected: [], uploaded: 0 };
		const outbox = getOutbox();
		if (outbox.length === 0) return result;

		const encrypted = await encryptCells(keys, outbox);
		const uploadable = encrypted.filter((cell) => {
			if (cell.data.length <= MAX_CELL_BYTES) return true;
			rejected.set(getCellKey(cell), { hlc: cell.hlc, retryAt: Infinity });
			result.oversized.push(toAddress(cell));
			return false;
		});

		for (let batch of batchCells(uploadable, batchCellLimit, batchByteLimit)) {
			if (isDisposed) return result;
			let posted = await postBatch(batch);
			if (posted.rejected.length > 0) {
				const rejectedKeys = new Set(posted.rejected.map(getCellKey));
				for (const cell of batch) {
					if (rejectedKeys.has(getCellKey(cell))) {
						rejected.set(getCellKey(cell), {
							hlc: cell.hlc,
							retryAt: Date.now() + REJECTED_RETRY_MS,
						});
						result.rejected.push(toAddress(cell));
					}
				}
				batch = batch.filter((cell) => !rejectedKeys.has(getCellKey(cell)));
				// The server writes nothing when it rejects a batch.
				if (batch.length === 0) continue;
				posted = await postBatch(batch);
				if (posted.rejected.length > 0) {
					throw new CellRequestError('Cells POST rejected twice', 422);
				}
			}
			// A reset server has accepted this batch but none of the earlier
			// cells; they are queued again for the next push.
			await updateServerEpoch(posted.epoch);
			// The server now has these cells or newer ones.
			const updatedStamps = batch.map(recordServerStamp);
			result.uploaded += batch.length;
			// The accepted sequence numbers hold only this device's own writes.
			// If they directly follow the last pull, there is nothing to pull.
			if (posted.accepted?.fromSeq === lastSeq + 1) {
				const { toSeq } = posted.accepted;
				store.transaction(() => setLastSeq(toSeq));
				await persistStore?.();
			}
			await state.save({ epoch: serverEpoch, stamps: updatedStamps });
		}
		return result;
	};

	const receive = async (message: string): Promise<ReceiveResult> => {
		let broadcast: unknown;
		try {
			broadcast = JSON.parse(message);
		} catch {
			return 'ignored';
		}
		const { cells, fromSeq, toSeq, type } = (broadcast ?? {}) as Record<
			string,
			unknown
		>;
		if (type === 'store') return 'legacy';
		if (
			type !== 'cells' ||
			typeof fromSeq !== 'number' ||
			typeof toSeq !== 'number' ||
			!Array.isArray(cells) ||
			!cells.every(isStoredCell)
		) {
			return 'ignored';
		}
		return exclusive(async () => {
			if (isDisposed || toSeq <= lastSeq) return 'ignored';
			if (fromSeq !== lastSeq + 1) return 'gap';
			const { isDeferred } = await applyServerCells(cells, { nextSeq: toSeq });
			return isDeferred || missingSeqs.size > 0 ? 'deferred' : 'applied';
		});
	};

	return {
		dispose: async () => {
			isDisposed = true;
			store.delListener(listenerId);
			await queue;
		},
		getPullRetry: () => pullRetry,
		hasPendingUploads: () => getOutbox().length > 0,
		hasUnsyncableCells: () =>
			[...rejected.entries()].some(
				([key, { hlc }]) =>
					pending.get(key)?.hlc === hlc && isNewer(hlc, stamps.get(key)),
			),
		init: () =>
			exclusive(async () => {
				const loaded = await state.load();
				readState();
				// Stamps of another epoch were saved by a tab that had not noticed
				// a reset yet; they don't hold for this server.
				if (loaded.epoch !== undefined && loaded.epoch !== serverEpoch) {
					stamps = new Map();
					await state.clear(serverEpoch);
				} else {
					stamps = loaded.stamps;
				}
				scanStore();
			}),
		pull: () => exclusive(pull),
		push: () => exclusive(push),
		receive,
	};
}
