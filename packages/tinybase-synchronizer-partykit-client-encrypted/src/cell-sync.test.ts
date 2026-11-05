import type { MergeableStore } from 'tinybase';
import type { CellSyncLimits } from './cell-sync';
import type { EncryptedCell } from './cells';
import { createMergeableStore } from 'tinybase';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	batchCells,
	CellRequestError,
	createCellSync,
	hasIncompletePull,
	REJECTED_RETRY_MS,
} from './cell-sync';
import { createMemoryCellSyncStateStore } from './cell-sync-state';
import { getCellKeys } from './cells';

const CELLS_URL = 'https://relay.example/parties/tinybase/room/cells';
const STATE_PREFIX = '_local:sync:';
const LAST_SEQ = `${STATE_PREFIX}lastSeq`;

interface FakeStoredCell extends EncryptedCell {
	seq: number;
}

/** An in-memory stand-in for the relay's `/cells` endpoints. */
function createFakeServer() {
	const cells = new Map<string, FakeStoredCell>();
	let head = 0;
	let epoch = 'epoch-1';
	const broadcasts: string[] = [];
	const requests: { method: string; size: number }[] = [];
	const server = {
		broadcasts,
		/** Rejects matching cells with 422, like a clock far ahead. */
		isFuture: (_cell: EncryptedCell) => false,
		/** Throws for the nth POST (1-based), like a dropped connection. */
		failPost: 0,
		/** Ends pages early, like the server's byte limit. */
		maxPageCells: Infinity,
		/** Replaces the ciphertext of matching cells in GET responses. */
		corrupt: (_cell: FakeStoredCell) => false,
		async fetch(input: string | URL, init: RequestInit = {}) {
			const url = new URL(input);
			const method = init.method ?? 'GET';
			if (method === 'GET' && url.searchParams.has('seq')) {
				const seqs = new Set(url.searchParams.getAll('seq').map(Number));
				const found = [...cells.values()]
					.filter((cell) => seqs.has(cell.seq))
					.map((cell) =>
						server.corrupt(cell)
							? { ...cell, data: btoa('garbage-data') }
							: cell,
					);
				requests.push({ method: 'GET seq', size: found.length });
				return Response.json({ cells: found, epoch, head });
			}
			if (method === 'GET') {
				const since = Number(url.searchParams.get('since'));
				const limit = Number(url.searchParams.get('limit'));
				const remaining = [...cells.values()]
					.filter((cell) => cell.seq > since)
					.sort((first, second) => first.seq - second.seq);
				const page = remaining
					.slice(0, Math.min(limit, server.maxPageCells))
					.map((cell) =>
						server.corrupt(cell)
							? { ...cell, data: btoa('garbage-data') }
							: cell,
					);
				requests.push({ method, size: page.length });
				return Response.json({
					cells: page,
					epoch,
					head,
					more: remaining.length > page.length,
				});
			}

			const batch = JSON.parse(String(init.body)) as EncryptedCell[];
			requests.push({ method, size: batch.length });
			if (
				server.failPost > 0 &&
				requests.filter((r) => r.method === 'POST').length === server.failPost
			) {
				throw new TypeError('Failed to fetch');
			}
			const future = batch.filter((cell) => server.isFuture(cell));
			if (future.length > 0) {
				return Response.json(
					{
						rejected: future.map(({ cell, kind, row, table }) => ({
							cell,
							kind,
							row,
							table,
						})),
					},
					{ status: 422 },
				);
			}
			const accepted: FakeStoredCell[] = [];
			for (const cell of batch) {
				const key = JSON.stringify([
					cell.kind,
					cell.table,
					cell.row,
					cell.cell,
				]);
				const stored = cells.get(key);
				if (stored && cell.hlc <= stored.hlc) continue;
				head += 1;
				const storedCell = { ...cell, seq: head };
				cells.set(key, storedCell);
				accepted.push(storedCell);
			}
			if (accepted.length > 0) {
				broadcasts.push(
					JSON.stringify({
						cells: accepted,
						fromSeq: accepted[0].seq,
						toSeq: accepted.at(-1)!.seq,
						type: 'cells',
					}),
				);
			}
			return Response.json(
				accepted.length > 0
					? {
							epoch,
							fromSeq: accepted[0].seq,
							head,
							toSeq: accepted.at(-1)!.seq,
						}
					: { epoch, head },
			);
		},
		get head() {
			return head;
		},
		requests,
		reset() {
			cells.clear();
			head = 0;
			epoch = `epoch-${Math.random()}`;
		},
	};
	return server;
}

let server: ReturnType<typeof createFakeServer>;

beforeEach(() => {
	server = createFakeServer();
	vi.stubGlobal('fetch', vi.fn(server.fetch));
});

afterEach(() => {
	vi.unstubAllGlobals();
});

async function createDevice(
	name: string,
	options: {
		limits?: CellSyncLimits;
		onIgnoredError?: (error: unknown) => void;
		persistStore?: () => Promise<void>;
	} = {},
) {
	const store = createMergeableStore(name);
	const state = createMemoryCellSyncStateStore();
	const sync = createCellSync({
		cellsUrl: CELLS_URL,
		keys: await getCellKeys('room'),
		state,
		stateValuePrefix: STATE_PREFIX,
		store,
		...options,
	});
	await sync.init();
	return { state, store, sync };
}

async function syncDevice({
	sync,
}: {
	sync: ReturnType<typeof createCellSync>;
}) {
	await sync.pull();
	await sync.push();
}

function feeding(store: MergeableStore, id: string, duration: number) {
	store.setRow('feedingSessions', id, { duration, side: 'left' });
}

describe('createCellSync', () => {
	it('syncs a new entry from one device to another', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		feeding(deviceA.store, 'f1', 10);

		await syncDevice(deviceA);
		await syncDevice(deviceB);

		expect(deviceB.store.getRow('feedingSessions', 'f1')).toEqual({
			duration: 10,
			side: 'left',
		});
	});

	it('uploads only cells the server does not have', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);

		deviceA.store.setCell('feedingSessions', 'f1', 'duration', 11);
		await syncDevice(deviceA);
		await syncDevice(deviceA);

		const posts = server.requests.filter((r) => r.method === 'POST');
		expect(posts.map((post) => post.size)).toEqual([2, 1]);
		expect(deviceA.sync.hasPendingUploads()).toBe(false);
	});

	it('does not upload cells it pulled', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		server.requests.length = 0;

		await syncDevice(deviceB);

		expect(server.requests.filter((r) => r.method === 'POST')).toEqual([]);
	});

	it('does not pull or apply its own uploads', async () => {
		const deviceA = await createDevice('a');
		await deviceA.sync.pull();
		feeding(deviceA.store, 'f1', 10);
		await deviceA.sync.push();
		server.requests.length = 0;

		expect(await deviceA.sync.receive(server.broadcasts[0])).toBe('ignored');
		await deviceA.sync.pull();

		expect(server.requests).toEqual([{ method: 'GET', size: 0 }]);
		expect(deviceA.store.getValue(LAST_SEQ)).toBe(2);
	});

	it('pulls only what changed since the last pull', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		for (let index = 0; index < 20; index += 1) {
			feeding(deviceA.store, `f${index}`, index);
		}
		await syncDevice(deviceA);
		await syncDevice(deviceB);

		deviceA.store.setCell('feedingSessions', 'f3', 'duration', 99);
		await syncDevice(deviceA);
		server.requests.length = 0;
		await deviceB.sync.pull();

		expect(server.requests).toEqual([{ method: 'GET', size: 1 }]);
		expect(deviceB.store.getCell('feedingSessions', 'f3', 'duration')).toBe(99);
	});

	it('pages through a large backlog', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b', { limits: { pageCells: 7 } });
		for (let index = 0; index < 10; index += 1) {
			feeding(deviceA.store, `f${index}`, index);
		}
		await syncDevice(deviceA);

		await deviceB.sync.pull();

		expect(deviceB.store.getRowCount('feedingSessions')).toBe(10);
		expect(deviceB.store.getValue(LAST_SEQ)).toBe(20);
	});

	it('applies a deletion made while the other device was offline', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		await syncDevice(deviceB);

		deviceB.store.delRow('feedingSessions', 'f1');
		await syncDevice(deviceB);
		await syncDevice(deviceA);

		expect(deviceA.store.hasRow('feedingSessions', 'f1')).toBe(false);
	});

	it('keeps concurrent edits of different cells and the later edit of the same cell', async () => {
		let now = 1_700_000_000_000;
		const getNow = () => now;
		const storeA = createMergeableStore('a', getNow);
		const storeB = createMergeableStore('b', getNow);
		const keys = await getCellKeys('room');
		const deviceA = createCellSync({
			cellsUrl: CELLS_URL,
			keys,
			state: createMemoryCellSyncStateStore(),
			store: storeA,
		});
		const deviceB = createCellSync({
			cellsUrl: CELLS_URL,
			keys,
			state: createMemoryCellSyncStateStore(),
			store: storeB,
		});
		await deviceA.init();
		await deviceB.init();
		feeding(storeA, 'f1', 10);
		await syncDevice({ sync: deviceA });
		await syncDevice({ sync: deviceB });

		now += 1000;
		storeA.setCell('feedingSessions', 'f1', 'side', 'right');
		storeA.setCell('feedingSessions', 'f1', 'duration', 11);
		now += 1000;
		storeB.setCell('feedingSessions', 'f1', 'duration', 12);
		storeB.setCell('feedingSessions', 'f1', 'notes', 'sleepy');
		await syncDevice({ sync: deviceA });
		await syncDevice({ sync: deviceB });
		await syncDevice({ sync: deviceA });

		const expected = { duration: 12, notes: 'sleepy', side: 'right' };
		expect(storeA.getRow('feedingSessions', 'f1')).toEqual(expected);
		expect(storeB.getRow('feedingSessions', 'f1')).toEqual(expected);
	});

	it('never uploads or applies local values', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		deviceA.store.setValue('_local:other', 'a');
		deviceA.store.setValue('currency', 'EUR');

		await syncDevice(deviceA);
		await syncDevice(deviceB);

		expect(deviceB.store.getValue('_local:other')).toBeUndefined();
		expect(deviceB.store.getValue(LAST_SEQ)).toBe(1);
		expect(server.head).toBe(1);
	});

	it('syncs values', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		deviceA.store.setValue('currency', 'EUR');

		await syncDevice(deviceA);
		await syncDevice(deviceB);

		expect(deviceB.store.getValue('currency')).toBe('EUR');
	});

	it('uploads migration markers first and rows in one piece', async () => {
		const deviceA = await createDevice('a', { limits: { batchCells: 3 } });
		feeding(deviceA.store, 'f1', 10);
		deviceA.store.setRow('_migrations', 'm1', { appliedAt: 1 });
		feeding(deviceA.store, 'f2', 20);

		await deviceA.sync.push();

		const batches = server.broadcasts.map((broadcast) =>
			(JSON.parse(broadcast) as { cells: EncryptedCell[] }).cells.map(
				(cell) => `${cell.table}/${cell.row}`,
			),
		);
		expect(batches).toEqual([
			['_migrations/m1', 'feedingSessions/f1', 'feedingSessions/f1'],
			['feedingSessions/f2', 'feedingSessions/f2'],
		]);
	});

	it('holds back cells the caller asks to', async () => {
		const store = createMergeableStore('a');
		const sync = createCellSync({
			cellsUrl: CELLS_URL,
			holdBack: (cell) => cell.row === 'partial',
			keys: await getCellKeys('room'),
			state: createMemoryCellSyncStateStore(),
			store,
		});
		await sync.init();
		feeding(store, 'partial', 10);
		feeding(store, 'f1', 20);

		await sync.push();

		expect(server.head).toBe(2);
		expect(sync.hasPendingUploads()).toBe(false);
	});

	it('marks the store before the first partial page is persisted', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		feeding(deviceA.store, 'f2', 20);
		await syncDevice(deviceA);
		server.maxPageCells = 2;
		const persistedFlags: unknown[] = [];
		let pages = 0;
		const deviceB = await createDevice('b', {
			persistStore: async () => {
				persistedFlags.push(
					deviceB.store.getValue(`${STATE_PREFIX}incomplete`),
				);
			},
		});
		const fetchMock = vi.mocked(fetch);
		fetchMock.mockImplementation(async (input, init) => {
			if ((pages += 1) === 2) throw new TypeError('Failed to fetch');
			return server.fetch(input as string | URL, init);
		});

		await expect(deviceB.sync.pull()).rejects.toThrow('Failed to fetch');

		expect(persistedFlags).toEqual([true]);
		expect(hasIncompletePull(deviceB.store)).toBe(true);
	});

	it('marks the store while a pull is incomplete', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		const deviceB = await createDevice('b', { onIgnoredError: () => {} });
		let isCorrupt = true;
		server.corrupt = (cell) => isCorrupt && cell.cell === 'side';

		await deviceB.sync.pull();
		expect(hasIncompletePull(deviceB.store)).toBe(true);

		isCorrupt = false;
		await deviceB.sync.pull();
		expect(hasIncompletePull(deviceB.store)).toBe(false);
	});

	it('resumes an interrupted upload without resending acknowledged batches', async () => {
		const deviceA = await createDevice('a', { limits: { batchCells: 2 } });
		for (let index = 0; index < 3; index += 1) {
			feeding(deviceA.store, `f${index}`, index);
		}
		server.failPost = 2;

		await expect(deviceA.sync.push()).rejects.toThrow('Failed to fetch');
		await deviceA.sync.push();

		const posts = server.requests.filter((r) => r.method === 'POST');
		expect(posts.map((post) => post.size)).toEqual([2, 2, 2, 2]);
		expect(server.head).toBe(6);
		expect(deviceA.sync.hasPendingUploads()).toBe(false);
	});

	it('keeps rejected cells locally and uploads the rest of the batch', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		server.isFuture = (cell) => cell.cell === 'side';

		const result = await deviceA.sync.push();

		expect(result.rejected).toEqual([
			{ cell: 'side', kind: 't', row: 'f1', table: 'feedingSessions' },
		]);
		expect(result.uploaded).toBe(1);
		expect(server.head).toBe(1);
		expect(deviceA.sync.hasUnsyncableCells()).toBe(true);
		// Not retried until the cell changes or some time has passed.
		expect(deviceA.sync.hasPendingUploads()).toBe(false);
		deviceA.store.setCell('feedingSessions', 'f1', 'side', 'right');
		expect(deviceA.sync.hasPendingUploads()).toBe(true);
		expect(deviceA.sync.hasUnsyncableCells()).toBe(false);
	});

	it('retries rejected cells after a while', async () => {
		vi.useFakeTimers({ now: 1_700_000_000_000, toFake: ['Date'] });
		try {
			const deviceA = await createDevice('a');
			feeding(deviceA.store, 'f1', 10);
			server.isFuture = (cell) => cell.cell === 'side';
			await deviceA.sync.push();
			server.isFuture = () => false;

			vi.setSystemTime(Date.now() + REJECTED_RETRY_MS + 1);

			expect(deviceA.sync.hasPendingUploads()).toBe(true);
			await deviceA.sync.push();
			expect(server.head).toBe(2);
			expect(deviceA.sync.hasUnsyncableCells()).toBe(false);
		} finally {
			vi.useRealTimers();
		}
	});

	it('reports cells above the size limit without uploading them', async () => {
		const deviceA = await createDevice('a');
		deviceA.store.setCell('events', 'e1', 'notes', 'x'.repeat(70 * 1024));
		deviceA.store.setCell('events', 'e1', 'title', 'Doctor');

		const result = await deviceA.sync.push();

		expect(result.oversized).toEqual([
			{ cell: 'notes', kind: 't', row: 'e1', table: 'events' },
		]);
		expect(result.uploaded).toBe(1);
		// Not retried until the cell changes.
		expect(deviceA.sync.hasPendingUploads()).toBe(false);
	});

	it('throws on server errors', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('Exceeded', { status: 429 })),
		);
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);

		await expect(deviceA.sync.pull()).rejects.toThrow(CellRequestError);
		await expect(deviceA.sync.push()).rejects.toMatchObject({ status: 429 });
		expect(deviceA.sync.hasPendingUploads()).toBe(true);
	});

	it('uploads everything again after the server lost its cells', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		server.reset();

		await syncDevice(deviceA);

		expect(server.head).toBe(2);
	});

	it('notices a reset room even after another device filled it again', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		feeding(deviceA.store, 'f1', 10);
		feeding(deviceB.store, 'f2', 20);
		await syncDevice(deviceA);
		await syncDevice(deviceB);
		await syncDevice(deviceA);
		server.reset();

		// A re-uploads everything, so the head is above B's last sequence number.
		await syncDevice(deviceA);
		await syncDevice(deviceA);
		await syncDevice(deviceB);
		await syncDevice(deviceA);

		const expected = ['f1', 'f2'];
		expect(deviceA.store.getRowIds('feedingSessions').sort()).toEqual(expected);
		expect(deviceB.store.getRowIds('feedingSessions').sort()).toEqual(expected);
		expect(server.head).toBe(4);
	});

	it('keeps pulling while the server says more cells follow', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		for (let index = 0; index < 5; index += 1) {
			feeding(deviceA.store, `f${index}`, index);
		}
		await syncDevice(deviceA);
		server.maxPageCells = 3;

		await deviceB.sync.pull();

		expect(deviceB.store.getRowCount('feedingSessions')).toBe(5);
	});

	it('keeps the server epoch with the sequence number in the store', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);

		await syncDevice(deviceA);

		expect(deviceA.store.getValue(`${STATE_PREFIX}epoch`)).toBe('epoch-1');
	});

	it('waits for a clock that is far behind instead of skipping cells', async () => {
		const now = Date.now();
		vi.useFakeTimers({ now, toFake: ['Date'] });
		try {
			const deviceA = await createDevice('a');
			feeding(deviceA.store, 'f1', 10);
			await syncDevice(deviceA);
			const deviceB = await createDevice('b');

			vi.setSystemTime(now - 10 * 60_000);
			await deviceB.sync.pull();

			expect(deviceB.store.hasRow('feedingSessions', 'f1')).toBe(false);
			expect(deviceB.sync.getPullRetry()).toBe('clock');
			expect(deviceB.store.getValue(LAST_SEQ)).toBeUndefined();

			vi.setSystemTime(now);
			await deviceB.sync.pull();

			expect(deviceB.store.getRow('feedingSessions', 'f1')).toEqual({
				duration: 10,
				side: 'left',
			});
			expect(deviceB.sync.getPullRetry()).toBeUndefined();
		} finally {
			vi.useRealTimers();
		}
	});

	it('fetches a cell that could not be decrypted again without holding back the room', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		feeding(deviceA.store, 'f2', 20);
		await syncDevice(deviceA);
		const deviceB = await createDevice('b', { onIgnoredError: () => {} });
		let isCorrupt = true;
		server.corrupt = (cell) =>
			isCorrupt && cell.row === 'f1' && cell.cell === 'duration';

		await deviceB.sync.pull();
		await deviceB.sync.pull();

		expect(deviceB.sync.getPullRetry()).toBe('decrypt');
		expect(deviceB.store.getValue(LAST_SEQ)).toBe(4);
		expect(deviceB.store.getCell('feedingSessions', 'f2', 'duration')).toBe(20);
		expect(deviceB.store.hasCell('feedingSessions', 'f1', 'duration')).toBe(
			false,
		);

		// Still fetched again after a restart.
		const restarted = createCellSync({
			cellsUrl: CELLS_URL,
			keys: await getCellKeys('room'),
			state: deviceB.state,
			stateValuePrefix: STATE_PREFIX,
			store: deviceB.store,
		});
		await restarted.init();
		isCorrupt = false;
		server.requests.length = 0;
		await restarted.pull();

		expect(deviceB.store.getCell('feedingSessions', 'f1', 'duration')).toBe(10);
		expect(restarted.getPullRetry()).toBeUndefined();
		expect(server.requests).toEqual([
			{ method: 'GET', size: 0 },
			{ method: 'GET seq', size: 1 },
		]);
	});

	it('stops fetching a missing cell once a newer write replaced it', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		const deviceB = await createDevice('b', { onIgnoredError: () => {} });
		server.corrupt = (cell) => cell.cell === 'duration' && cell.seq === 1;
		await deviceB.sync.pull();
		expect(deviceB.sync.getPullRetry()).toBe('decrypt');

		deviceA.store.setCell('feedingSessions', 'f1', 'duration', 11);
		await syncDevice(deviceA);
		await deviceB.sync.pull();

		expect(deviceB.store.getCell('feedingSessions', 'f1', 'duration')).toBe(11);
		expect(deviceB.sync.getPullRetry()).toBeUndefined();
	});

	it('ignores stamps another tab saved for an earlier server epoch', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		await deviceA.sync.pull();
		server.reset();
		await deviceA.sync.pull();
		// A tab that has not noticed the reset saves an old acknowledgement.
		await deviceA.state.save({ epoch: 'epoch-1', stamps: [['x', 'hlc']] });

		expect((await deviceA.state.load()).stamps.has('x')).toBe(false);
		expect(deviceA.sync.hasPendingUploads()).toBe(true);
	});

	it('reports that the legacy snapshot changed', async () => {
		const deviceA = await createDevice('a');

		expect(await deviceA.sync.receive('{"type":"store"}')).toBe('legacy');
	});

	it('restores its state after a restart', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		await deviceA.sync.pull();
		server.requests.length = 0;

		const restarted = createCellSync({
			cellsUrl: CELLS_URL,
			keys: await getCellKeys('room'),
			state: deviceA.state,
			stateValuePrefix: STATE_PREFIX,
			store: deviceA.store,
		});
		await restarted.init();
		await syncDevice({ sync: restarted });

		expect(restarted.hasPendingUploads()).toBe(false);
		expect(server.requests).toEqual([{ method: 'GET', size: 0 }]);
	});

	it('pulls everything again when the store was cleared but its sync state was not', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		const deviceB = await createDevice('b');
		await deviceB.sync.pull();

		const cleared = createMergeableStore('b2');
		const restarted = createCellSync({
			cellsUrl: CELLS_URL,
			keys: await getCellKeys('room'),
			state: deviceB.state,
			stateValuePrefix: STATE_PREFIX,
			store: cleared,
		});
		await restarted.init();
		await restarted.pull();

		expect(cleared.hasRow('feedingSessions', 'f1')).toBe(true);
	});

	it('persists the pulled cells and sequence number before the server stamps', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		const order: string[] = [];
		const deviceB = await createDevice('b', {
			persistStore: async () => {
				order.push(
					`persist:${deviceB.store.getRowCount('feedingSessions')} rows, seq ${deviceB.store.getValue(LAST_SEQ)}`,
				);
			},
		});
		const save = deviceB.state.save;
		deviceB.state.save = async (update) => {
			if (update.stamps) order.push(`stamps:${[...update.stamps].length}`);
			return save(update);
		};

		await deviceB.sync.pull();

		// The sequence number is persisted with the cells it covers, the
		// server stamps after them.
		expect(order).toEqual(['persist:1 rows, seq 2', 'stamps:2']);
	});

	describe('receive', () => {
		it('applies a broadcast that directly follows the last pull', async () => {
			const deviceA = await createDevice('a');
			const deviceB = await createDevice('b');
			await deviceB.sync.pull();
			feeding(deviceA.store, 'f1', 10);
			await deviceA.sync.push();

			expect(await deviceB.sync.receive(server.broadcasts[0])).toBe('applied');
			expect(deviceB.store.getRow('feedingSessions', 'f1')).toEqual({
				duration: 10,
				side: 'left',
			});
			expect(deviceB.store.getValue(LAST_SEQ)).toBe(2);
		});

		it('reports a gap when a broadcast was missed', async () => {
			const deviceA = await createDevice('a');
			const deviceB = await createDevice('b');
			await deviceB.sync.pull();
			feeding(deviceA.store, 'f1', 10);
			await deviceA.sync.push();
			deviceA.store.setCell('feedingSessions', 'f1', 'duration', 11);
			await deviceA.sync.push();

			expect(await deviceB.sync.receive(server.broadcasts[1])).toBe('gap');
			expect(deviceB.store.hasRow('feedingSessions', 'f1')).toBe(false);
		});

		it('ignores broadcasts it already pulled and invalid messages', async () => {
			const deviceA = await createDevice('a');
			const deviceB = await createDevice('b');
			feeding(deviceA.store, 'f1', 10);
			await deviceA.sync.push();
			await deviceB.sync.pull();

			expect(await deviceB.sync.receive(server.broadcasts[0])).toBe('ignored');
			expect(await deviceB.sync.receive('not json')).toBe('ignored');
			expect(await deviceB.sync.receive('{"type":"other"}')).toBe('ignored');
		});
	});

	it('does not apply results that arrive after dispose', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await deviceA.sync.push();
		const deviceB = await createDevice('b');
		let releaseFetch!: () => void;
		const fetchGate = new Promise<void>((resolve) => {
			releaseFetch = resolve;
		});
		vi.stubGlobal(
			'fetch',
			vi.fn(async (input: string | URL, init?: RequestInit) => {
				await fetchGate;
				return server.fetch(input, init);
			}),
		);

		const pull = deviceB.sync.pull();
		await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
		const disposed = deviceB.sync.dispose();
		releaseFetch();
		await pull;
		await disposed;

		expect(deviceB.store.hasRow('feedingSessions', 'f1')).toBe(false);
	});
});

function cell(data: string): EncryptedCell {
	return {
		cell: 'c',
		data,
		hlc: '0000000000000000',
		kind: 't',
		row: 'r',
		table: 't',
	};
}

function rowCells(row: string, count: number): EncryptedCell[] {
	return Array.from({ length: count }, (_, index) => ({
		...cell('x'),
		cell: `c${index}`,
		row,
	}));
}

describe('batchCells', () => {
	it('keeps the cells of a row together unless the row alone is too large', () => {
		const batches = batchCells(
			[...rowCells('a', 2), ...rowCells('b', 2), ...rowCells('c', 4)],
			3,
			1_000_000,
		);

		expect(
			batches.map((batch) => batch.map(({ row }) => row).join('')),
		).toEqual(['aa', 'bb', 'ccc', 'c']);
	});

	it('splits by count and by bytes', () => {
		const cells = Array.from({ length: 5 }, () => cell('x'.repeat(100)));

		expect(batchCells(cells, 2, 1_000_000).map((b) => b.length)).toEqual([
			2, 2, 1,
		]);
		expect(batchCells(cells, 100, 1024 + 400).map((b) => b.length)).toEqual([
			2, 2, 1,
		]);
	});
});
