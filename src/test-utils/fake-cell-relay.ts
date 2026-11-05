import type { EncryptedCell } from 'tinybase-synchronizer-partykit-client-encrypted';
import { createMergeableStore } from 'tinybase';
import {
	buildChanges,
	decryptCells,
	getCellKeys,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { vi } from 'vitest';

interface StoredCell extends EncryptedCell {
	seq: number;
}

interface FakeRoom {
	cells: Map<string, StoredCell>;
	head: number;
}

/**
 * An in-memory stand-in for the relay's per-cell endpoints and legacy
 * snapshot, installed as the global `fetch`. Cells stay encrypted, like on the
 * real relay.
 */
export function installFakeCellRelay() {
	const rooms = new Map<string, FakeRoom>();
	const broadcasts: string[] = [];
	const relay = {
		broadcasts,
		/** Replaces the ciphertext of matching cells in responses. */
		corrupt: (_cell: EncryptedCell) => false,
		/** Fails this many of the next cells requests with a 500. */
		failingRequests: 0,
		/** Makes legacy snapshot requests fail. */
		isStoreFailing: false,
		/** Makes every request fail, like an unreachable relay. */
		isUnreachable: false,
		requests: [] as { method: string; path: string }[],
	};

	const getRoom = (roomHash: string) => {
		let room = rooms.get(roomHash);
		if (!room) {
			room = { cells: new Map(), head: 0 };
			rooms.set(roomHash, room);
		}
		return room;
	};

	const fetchMock = vi.fn(
		async (input: string | URL, init: RequestInit = {}) => {
			const url = new URL(input);
			const method = init.method ?? 'GET';
			relay.requests.push({ method, path: url.pathname });
			if (relay.isUnreachable) {
				throw new TypeError('Failed to fetch');
			}
			const [, , , roomHash, endpoint] = url.pathname.split('/');
			const room = getRoom(roomHash);

			if (endpoint === 'cells' && relay.failingRequests > 0) {
				relay.failingRequests -= 1;
				return new Response('Internal error', { status: 500 });
			}
			if (endpoint === 'store') {
				if (relay.isStoreFailing) {
					return new Response('Internal error', { status: 500 });
				}
				return new Response('null', { headers: { ETag: '"0"' } });
			}
			const send = (cells: StoredCell[]) =>
				cells.map((cell) =>
					relay.corrupt(cell) ? { ...cell, data: btoa('garbage-data') } : cell,
				);
			if (method === 'GET' && url.searchParams.has('seq')) {
				const seqs = new Set(url.searchParams.getAll('seq').map(Number));
				return Response.json({
					cells: send([...room.cells.values()].filter((c) => seqs.has(c.seq))),
					head: room.head,
				});
			}
			if (method === 'GET') {
				const since = Number(url.searchParams.get('since'));
				const limit = Number(url.searchParams.get('limit'));
				const cells = [...room.cells.values()]
					.filter((cell) => cell.seq > since)
					.sort((first, second) => first.seq - second.seq)
					.slice(0, limit);
				return Response.json({ cells: send(cells), head: room.head });
			}

			const accepted: StoredCell[] = [];
			for (const cell of JSON.parse(String(init.body)) as EncryptedCell[]) {
				const key = JSON.stringify([
					cell.kind,
					cell.table,
					cell.row,
					cell.cell,
				]);
				const stored = room.cells.get(key);
				if (stored && cell.hlc <= stored.hlc) continue;
				room.head += 1;
				const storedCell = { ...cell, seq: room.head };
				room.cells.set(key, storedCell);
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
							fromSeq: accepted[0].seq,
							head: room.head,
							toSeq: accepted.at(-1)!.seq,
						}
					: { head: room.head },
			);
		},
	);
	vi.stubGlobal('fetch', fetchMock);

	return Object.assign(relay, {
		fetch: fetchMock,
		/** Decrypts the room's cells into a store, like a new device would. */
		async getStore(roomName: string, roomHash: string) {
			const room = getRoom(roomHash);
			const cells = await decryptCells(await getCellKeys(roomName), [
				...room.cells.values(),
			]);
			const store = createMergeableStore();
			store.applyMergeableChanges(buildChanges(cells));
			return store;
		},
	});
}
