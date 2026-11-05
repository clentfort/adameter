import type { MergeableStore } from 'tinybase';
import type { CellSyncLimits } from './cell-sync';
import type { EncryptedCell } from './cells';
import { createMergeableStore } from 'tinybase';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { batchCells, CellRequestError, createCellSync } from './cell-sync';
import { createMemoryCellSyncStateStore } from './cell-sync-state';
import { getCellKeys } from './cells';

const CELLS_URL = 'https://relay.example/parties/tinybase/room/cells';

interface FakeStoredCell extends EncryptedCell {
	seq: number;
}

/** An in-memory stand-in for the relay's `/cells` endpoints. */
function createFakeServer() {
	const cells = new Map<string, FakeStoredCell>();
	let head = 0;
	const broadcasts: string[] = [];
	const requests: { method: string; size: number }[] = [];
	const server = {
		broadcasts,
		/** Rejects matching cells with 422, like a clock far ahead. */
		isFuture: (_cell: EncryptedCell) => false,
		/** Throws for the nth POST (1-based), like a dropped connection. */
		failPost: 0,
		async fetch(input: string | URL, init: RequestInit = {}) {
			const url = new URL(input);
			const method = init.method ?? 'GET';
			if (method === 'GET') {
				const since = Number(url.searchParams.get('since'));
				const limit = Number(url.searchParams.get('limit'));
				const page = [...cells.values()]
					.filter((cell) => cell.seq > since)
					.sort((first, second) => first.seq - second.seq)
					.slice(0, limit);
				requests.push({ method, size: page.length });
				return Response.json({ cells: page, head });
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
			return Response.json({ head });
		},
		get head() {
			return head;
		},
		requests,
		reset() {
			cells.clear();
			head = 0;
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
	options: { limits?: CellSyncLimits; persistStore?: () => Promise<void> } = {},
) {
	const store = createMergeableStore(name);
	const state = createMemoryCellSyncStateStore();
	const sync = createCellSync({
		cellsUrl: CELLS_URL,
		keys: await getCellKeys('room'),
		state,
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
		expect((await deviceB.state.load()).lastSeq).toBe(20);
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

	it('syncs values', async () => {
		const deviceA = await createDevice('a');
		const deviceB = await createDevice('b');
		deviceA.store.setValue('currency', 'EUR');

		await syncDevice(deviceA);
		await syncDevice(deviceB);

		expect(deviceB.store.getValue('currency')).toBe('EUR');
	});

	it('uploads migration markers last', async () => {
		const deviceA = await createDevice('a', { limits: { batchCells: 2 } });
		deviceA.store.setRow('_migrations', 'm1', { appliedAt: 1 });
		feeding(deviceA.store, 'f1', 10);
		feeding(deviceA.store, 'f2', 20);

		await deviceA.sync.push();

		const lastBatch = JSON.parse(server.broadcasts.at(-1)!) as {
			cells: EncryptedCell[];
		};
		expect(lastBatch.cells.map((cell) => cell.table)).toEqual(['_migrations']);
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
		// Not retried until the cell changes.
		expect(deviceA.sync.hasPendingUploads()).toBe(false);
		deviceA.store.setCell('feedingSessions', 'f1', 'side', 'right');
		expect(deviceA.sync.hasPendingUploads()).toBe(true);
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
			store: deviceA.store,
		});
		await restarted.init();
		await syncDevice({ sync: restarted });

		expect(restarted.hasPendingUploads()).toBe(false);
		expect(server.requests).toEqual([{ method: 'GET', size: 0 }]);
	});

	it('persists the store before saving the pulled sequence number', async () => {
		const deviceA = await createDevice('a');
		feeding(deviceA.store, 'f1', 10);
		await syncDevice(deviceA);
		const order: string[] = [];
		const deviceB = await createDevice('b', {
			persistStore: async () => {
				order.push(`persist:${(await deviceB.state.load()).lastSeq}`);
			},
		});
		const save = deviceB.state.save;
		deviceB.state.save = async (update) => {
			order.push(`save:${update.lastSeq}`);
			return save(update);
		};

		await deviceB.sync.pull();

		expect(order).toEqual(['persist:0', 'save:2']);
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
			expect((await deviceB.state.load()).lastSeq).toBe(2);
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

describe('batchCells', () => {
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
