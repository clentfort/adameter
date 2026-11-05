import { createMergeableStore } from 'tinybase';
import {
	encrypt,
	encryptCell,
	getCellKeys,
	getEncryptionKey,
	hashRoomId,
	jsonStringWithUndefined,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cloneRoomData } from './cloning';

const SOURCE_ROOM = 'source-room';

interface FakeRoom {
	cells?: unknown[];
	snapshot?: string;
	status?: number;
}

async function serveRoom({
	cells = [],
	snapshot = 'null',
	status = 200,
}: FakeRoom) {
	const roomHash = await hashRoomId(SOURCE_ROOM);
	const fetchMock = vi.fn(async (input: string | URL) => {
		const url = new URL(input);
		expect(url.pathname).toContain(`/parties/tinybase/${roomHash}/`);
		if (status !== 200) return new Response('Not found', { status });
		if (url.pathname.endsWith('/cells')) {
			return Response.json({ cells, head: cells.length });
		}
		return new Response(snapshot, { headers: { ETag: '"1"' } });
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('cloneRoomData', () => {
	it('merges the cells of the source room', async () => {
		const keys = await getCellKeys(SOURCE_ROOM);
		const encrypted = await encryptCell(keys, {
			cell: 'title',
			hlc: '0000000000000000',
			kind: 't',
			row: 'e1',
			table: 'events',
			value: 'Doctor',
		});
		const fetchMock = await serveRoom({ cells: [{ ...encrypted, seq: 1 }] });
		const store = createMergeableStore();

		await cloneRoomData(SOURCE_ROOM, 'localhost:1999', store);

		expect(store.getCell('events', 'e1', 'title')).toBe('Doctor');
		expect(String(fetchMock.mock.calls[0][0])).toMatch(
			/^http:\/\/localhost:1999\//,
		);
	});

	it('merges a legacy snapshot of the source room', async () => {
		const source = createMergeableStore();
		source.setCell('events', 'e2', 'title', 'Vaccination');
		await serveRoom({
			snapshot: await encrypt(
				jsonStringWithUndefined(source.getMergeableContent()),
				await getEncryptionKey(SOURCE_ROOM),
			),
		});
		const store = createMergeableStore();

		await cloneRoomData(SOURCE_ROOM, 'relay.example', store);

		expect(store.getCell('events', 'e2', 'title')).toBe('Vaccination');
	});

	it('fails instead of copying a room only partly', async () => {
		const keys = await getCellKeys(SOURCE_ROOM);
		const encrypted = await encryptCell(keys, {
			cell: 'title',
			hlc: '0000000000000000',
			kind: 't',
			row: 'e1',
			table: 'events',
			value: 'Doctor',
		});
		await serveRoom({
			cells: [{ ...encrypted, data: btoa('garbage-data'), seq: 1 }],
		});

		await expect(
			cloneRoomData(SOURCE_ROOM, 'relay.example', createMergeableStore()),
		).rejects.toThrow(/Could not copy all data/);
	});

	it('fails for an empty or unreachable source room', async () => {
		await serveRoom({});
		await expect(
			cloneRoomData(SOURCE_ROOM, 'relay.example', createMergeableStore()),
		).rejects.toThrow(/No content found/);

		await serveRoom({ status: 404 });
		await expect(
			cloneRoomData(SOURCE_ROOM, 'relay.example', createMergeableStore()),
		).rejects.toThrow(/404/);
	});
});
