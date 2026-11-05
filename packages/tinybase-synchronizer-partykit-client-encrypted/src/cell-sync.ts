import type { MergeableStore } from 'tinybase';
import type { CellSyncStateStore } from './cell-sync-state';
import type { CellAddress, CellKeys, EncryptedCell, PlainCell } from './cells';
import {
	buildChanges,
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
// Room for the JSON array brackets and separators of a batch.
const BATCH_OVERHEAD_BYTES = 1024;
// Cells of this table are uploaded last, so a device that pulls a partial
// upload runs a migration itself instead of trusting a marker whose rows have
// not arrived yet.
const MIGRATIONS_TABLE = '_migrations';

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
	head: number;
}

export interface CellSyncLimits {
	batchBytes?: number;
	batchCells?: number;
	pageCells?: number;
}

export interface CellSyncOptions {
	/** `https://<host>/parties/<party>/<room>/cells` */
	cellsUrl: string;
	keys: CellKeys;
	limits?: CellSyncLimits;
	onIgnoredError?: (error: unknown) => void;
	/** Resolves once the store's own persister has saved pulled cells. */
	persistStore?: () => Promise<void>;
	state: CellSyncStateStore;
	store: MergeableStore;
}

export interface PushResult {
	/** Cells above the server's size limit. They are kept locally only. */
	oversized: CellAddress[];
	/** Cells the server rejected, e.g. because of a clock far ahead. */
	rejected: CellAddress[];
	uploaded: number;
}

export type ReceiveResult = 'applied' | 'gap' | 'ignored';

export interface CellSync {
	/** Stops listening to the store and waits for running work. */
	dispose(): Promise<void>;
	hasPendingUploads(): boolean;
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

/** Splits cells into batches below the count and byte limits. */
export function batchCells(
	cells: readonly EncryptedCell[],
	maxCells: number,
	maxBytes: number,
): EncryptedCell[][] {
	const batches: EncryptedCell[][] = [];
	let batch: EncryptedCell[] = [];
	let bytes = BATCH_OVERHEAD_BYTES;
	for (const cell of cells) {
		const cellBytes = JSON.stringify(cell).length + 1;
		if (
			batch.length > 0 &&
			(batch.length >= maxCells || bytes + cellBytes > maxBytes)
		) {
			batches.push(batch);
			batch = [];
			bytes = BATCH_OVERHEAD_BYTES;
		}
		batch.push(cell);
		bytes += cellBytes;
	}
	if (batch.length > 0) batches.push(batch);
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
	keys,
	limits = {},
	onIgnoredError,
	persistStore,
	state,
	store,
}: CellSyncOptions): CellSync {
	const batchCellLimit = limits.batchCells ?? MAX_BATCH_CELLS;
	const batchByteLimit = limits.batchBytes ?? MAX_BATCH_BYTES;
	const pageCells = limits.pageCells ?? PAGE_CELLS;

	let lastSeq = 0;
	let stamps = new Map<string, string>();
	// Local cells that may be missing on the server, by cell key.
	const pending = new Map<string, PlainCell>();
	// HLCs the server rejected per cell key; retried once the cell changes.
	const rejected = new Map<string, string>();
	let isDisposed = false;
	let queue: Promise<unknown> = Promise.resolve();

	const exclusive = <Result>(operation: () => Promise<Result>) => {
		const result = queue.then(operation);
		queue = result.catch(() => {});
		return result;
	};

	const trackLocalCell = (cell: PlainCell) => {
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

	const recordServerStamp = (cell: CellAddress & { hlc: string }) => {
		const key = getCellKey(cell);
		if (isNewer(cell.hlc, stamps.get(key))) stamps.set(key, cell.hlc);
		const local = pending.get(key);
		if (local && !isNewer(local.hlc, stamps.get(key))) pending.delete(key);
		return [key, stamps.get(key)!] as [string, string];
	};

	const decryptAll = async (cells: readonly EncryptedCell[]) => {
		const decrypted: PlainCell[] = [];
		for (let start = 0; start < cells.length; start += 500) {
			const results = await Promise.allSettled(
				cells.slice(start, start + 500).map((cell) => decryptCell(keys, cell)),
			);
			for (const result of results) {
				if (result.status === 'fulfilled') {
					decrypted.push(result.value);
				} else {
					// A cell that cannot be decrypted is skipped; the rest of the
					// room still syncs.
					onIgnoredError?.(result.reason);
				}
			}
		}
		return decrypted;
	};

	/** Applies cells from the server and persists the new state. */
	const applyServerCells = async (
		cells: readonly StoredCell[],
		nextSeq: number,
	) => {
		const decrypted = await decryptAll(cells);
		if (isDisposed) return 0;

		// Record the stamps first, so the store listener does not queue the
		// applied cells for upload.
		const updatedStamps = cells.map(recordServerStamp);
		if (decrypted.length > 0) {
			store.applyMergeableChanges(buildChanges(decrypted));
		}
		// The state must never claim cells the store has not saved yet. A crash
		// in between only causes them to be pulled again.
		await persistStore?.();
		if (isDisposed) return 0;
		await state.save({ lastSeq: nextSeq, stamps: updatedStamps });
		lastSeq = nextSeq;
		return decrypted.length;
	};

	const fetchPage = async (since: number): Promise<CellsPage> => {
		const url = new URL(cellsUrl);
		url.searchParams.set('since', String(since));
		url.searchParams.set('limit', String(pageCells));
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
	};

	const resetServerState = async () => {
		// Upload everything again.
		lastSeq = 0;
		stamps = new Map();
		await state.clear();
		scanStore();
	};

	const pull = async () => {
		let applied = 0;
		for (;;) {
			const page = await fetchPage(lastSeq);
			if (isDisposed) return { applied };
			// Fewer cells than this device pulled or uploaded: the room's storage
			// was lost or reset.
			if (page.head < lastSeq || (page.head === 0 && stamps.size > 0)) {
				await resetServerState();
				continue;
			}
			const isLastPage = page.cells.length < pageCells;
			const nextSeq = isLastPage ? page.head : page.cells.at(-1)!.seq;
			applied += await applyServerCells(page.cells, nextSeq);
			if (isDisposed || isLastPage) return { applied };
		}
	};

	interface PostResult {
		/** Sequence numbers of the accepted cells, if any were accepted. */
		accepted?: { fromSeq: number; toSeq: number };
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
		const { fromSeq, toSeq } = (await response.json()) as {
			fromSeq?: unknown;
			toSeq?: unknown;
		};
		return {
			accepted:
				typeof fromSeq === 'number' && typeof toSeq === 'number'
					? { fromSeq, toSeq }
					: undefined,
			rejected: [],
		};
	};

	const getOutbox = () =>
		[...pending.entries()]
			.filter(
				([key, cell]) =>
					isNewer(cell.hlc, stamps.get(key)) && rejected.get(key) !== cell.hlc,
			)
			.map(([, cell]) => cell)
			// Stable sort: everything else first, migration markers last.
			.sort(
				(first, second) =>
					Number(first.table === MIGRATIONS_TABLE) -
					Number(second.table === MIGRATIONS_TABLE),
			);

	const push = async (): Promise<PushResult> => {
		const result: PushResult = { oversized: [], rejected: [], uploaded: 0 };
		const outbox = getOutbox();
		if (outbox.length === 0) return result;

		const encrypted = await encryptCells(keys, outbox);
		const uploadable = encrypted.filter((cell) => {
			if (cell.data.length <= MAX_CELL_BYTES) return true;
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
						rejected.set(getCellKey(cell), cell.hlc);
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
			// The server now has these cells or newer ones.
			const updatedStamps = batch.map(recordServerStamp);
			result.uploaded += batch.length;
			// The accepted sequence numbers hold only this device's own writes.
			// If they directly follow the last pull, there is nothing to pull.
			let nextSeq: number | undefined;
			if (posted.accepted?.fromSeq === lastSeq + 1) {
				nextSeq = posted.accepted.toSeq;
				await persistStore?.();
			}
			await state.save({ lastSeq: nextSeq, stamps: updatedStamps });
			if (nextSeq !== undefined) lastSeq = nextSeq;
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
			await applyServerCells(cells, toSeq);
			return 'applied';
		});
	};

	return {
		dispose: async () => {
			isDisposed = true;
			store.delListener(listenerId);
			await queue;
		},
		hasPendingUploads: () => getOutbox().length > 0,
		init: () =>
			exclusive(async () => {
				const loaded = await state.load();
				lastSeq = loaded.lastSeq;
				stamps = loaded.stamps;
				scanStore();
				// State that claims pulled cells for an empty store is stale, e.g.
				// after the store's database was cleared. Pull everything again.
				if (
					loaded.lastSeq > 0 &&
					flattenChanges(store.getMergeableContent()).length === 0
				) {
					await resetServerState();
				}
			}),
		pull: () => exclusive(pull),
		push: () => exclusive(push),
		receive,
	};
}
