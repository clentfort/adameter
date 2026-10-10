import { createMergeableStore } from 'tinybase';
import {
	encrypt,
	getEncryptionKey,
	jsonStringWithUndefined,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getItem, STORAGE_KEYS } from '@/lib/storage';
import { TABLE_IDS } from './constants';
import { mergeLegacyRoomData } from './legacy-room-migration';

const STORE_URL = 'https://new.example/parties/tinybase/room-hash/store';
const IMPORTED_URL =
	'https://new.example/parties/tinybase/room-hash/legacy-store';
const LEGACY_URL = 'https://legacy.example/parties/tinybase/room-hash/store';
const BEFORE_SHUTDOWN = new Date('2026-10-20T00:00:00Z');
const AFTER_SHUTDOWN = new Date('2026-10-24T00:00:00Z');

async function encryptSnapshotWithEvent(key: CryptoKey, rowId: string) {
	const source = createMergeableStore();
	source.setRow(TABLE_IDS.EVENTS, rowId, { title: rowId });
	return encrypt(jsonStringWithUndefined(source.getMergeableContent()), key);
}

function mockFetch(responses: Record<string, string | Error>) {
	const fetchMock = vi.fn((url: string) => {
		const response = responses[url];
		if (response instanceof Error) {
			return Promise.reject(response);
		}
		if (response === undefined) {
			return Promise.resolve(new Response('Not found', { status: 404 }));
		}
		return Promise.resolve(new Response(response, { status: 200 }));
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

describe('mergeLegacyRoomData', () => {
	let encryptionKey: CryptoKey;

	beforeEach(async () => {
		window.localStorage.clear();
		encryptionKey = await getEncryptionKey('room');
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('merges the imported snapshot and the legacy host before shutdown', async () => {
		mockFetch({
			[IMPORTED_URL]: await encryptSnapshotWithEvent(encryptionKey, 'imported'),
			[LEGACY_URL]: await encryptSnapshotWithEvent(encryptionKey, 'legacy'),
		});
		const store = createMergeableStore();
		store.setRow(TABLE_IDS.EVENTS, 'local', { title: 'local' });

		const didMerge = await mergeLegacyRoomData({
			encryptionKey,
			hashedRoomId: 'room-hash',
			legacyHost: 'legacy.example',
			now: BEFORE_SHUTDOWN,
			store,
			storeUrl: STORE_URL,
		});

		expect(didMerge).toBe(true);
		expect(store.getRowIds(TABLE_IDS.EVENTS).toSorted()).toEqual([
			'imported',
			'legacy',
			'local',
		]);
		// Keep re-reading the legacy host until it is gone.
		expect(getItem(STORAGE_KEYS.LEGACY_ROOM_MIGRATIONS)).toBeNull();
	});

	it('still merges from the legacy host when nothing was imported', async () => {
		mockFetch({
			[IMPORTED_URL]: 'null',
			[LEGACY_URL]: await encryptSnapshotWithEvent(encryptionKey, 'legacy'),
		});
		const store = createMergeableStore();

		const didMerge = await mergeLegacyRoomData({
			encryptionKey,
			hashedRoomId: 'room-hash',
			legacyHost: 'legacy.example',
			now: BEFORE_SHUTDOWN,
			store,
			storeUrl: STORE_URL,
		});

		expect(didMerge).toBe(true);
		expect(store.hasRow(TABLE_IDS.EVENTS, 'legacy')).toBe(true);
	});

	it('tolerates an unreachable legacy host', async () => {
		mockFetch({
			[IMPORTED_URL]: 'null',
			[LEGACY_URL]: new Error('network down'),
		});

		const didMerge = await mergeLegacyRoomData({
			encryptionKey,
			hashedRoomId: 'room-hash',
			legacyHost: 'legacy.example',
			now: BEFORE_SHUTDOWN,
			store: createMergeableStore(),
			storeUrl: STORE_URL,
		});

		expect(didMerge).toBe(false);
	});

	it('only reads the imported snapshot after shutdown and then marks the room', async () => {
		const fetchMock = mockFetch({
			[IMPORTED_URL]: await encryptSnapshotWithEvent(encryptionKey, 'imported'),
		});
		const store = createMergeableStore();

		const options = {
			encryptionKey,
			hashedRoomId: 'room-hash',
			legacyHost: 'legacy.example',
			now: AFTER_SHUTDOWN,
			store,
			storeUrl: STORE_URL,
		};
		expect(await mergeLegacyRoomData(options)).toBe(true);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe(IMPORTED_URL);
		expect(store.hasRow(TABLE_IDS.EVENTS, 'imported')).toBe(true);

		expect(await mergeLegacyRoomData(options)).toBe(false);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('does not mark the room when the imported snapshot cannot be read', async () => {
		mockFetch({});

		await mergeLegacyRoomData({
			encryptionKey,
			hashedRoomId: 'room-hash',
			now: AFTER_SHUTDOWN,
			store: createMergeableStore(),
			storeUrl: STORE_URL,
		});

		expect(getItem(STORAGE_KEYS.LEGACY_ROOM_MIGRATIONS)).toBeNull();
	});
});
