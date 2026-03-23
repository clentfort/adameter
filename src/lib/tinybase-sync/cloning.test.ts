import { createMergeableStore } from 'tinybase';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { cloneRoomData } from './cloning';
import { decryptContent } from 'tinybase-persister-partykit-client-encrypted';
import {
	decrypt,
	getEncryptionKey,
	hashRoomId,
} from 'tinybase-synchronizer-partykit-client-encrypted';

vi.mock('tinybase-persister-partykit-client-encrypted', () => ({
	decryptContent: vi.fn(),
}));

vi.mock('tinybase-synchronizer-partykit-client-encrypted', () => ({
	decrypt: vi.fn(),
	getEncryptionKey: vi.fn(),
	hashRoomId: vi.fn(),
	jsonParseWithUndefined: vi.fn((v) => {
		if (v === 'invalid-json') return undefined;
		try {
			return JSON.parse(v);
		} catch {
			return v;
		}
	}),
}));

describe('cloneRoomData', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn();
	});

	it('clones data from a source room in both legacy and modern formats', async () => {
		const store = createMergeableStore('m1');
		const sourceRoom = 'source-room';
		const mockKey = { type: 'secret' } as unknown as CryptoKey;

		vi.mocked(hashRoomId).mockResolvedValue('hashed-room-id');
		vi.mocked(getEncryptionKey).mockResolvedValue(mockKey);

		// 1. Test legacy format (starts with '[') on localhost
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('[{"t1":{"r1":{"c1":1}}},{"v1":1}]'),
		} as Response);
		vi.mocked(decryptContent).mockResolvedValueOnce([
			{ t1: { r1: { c1: 1 } } },
			{ v1: 1 },
		]);

		await cloneRoomData(sourceRoom, 'localhost:3000', store);

		expect(store.getContent()).toEqual([{ t1: { r1: { c1: 1 } } }, { v1: 1 }]);
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3000/parties/tinybase/hashed-room-id/store',
			expect.any(Object),
		);

		// 2. Test modern format (encrypted blob) on 127.0.0.1
		store.delTables();
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('encrypted-blob'),
		} as Response);

		// Set store state directly to see what applyMergeableChanges expects by observing a real store
		const otherStore = createMergeableStore('m2');
		otherStore.setTable('t2', { r2: { c2: 2 } });
		const changes2 = otherStore.getMergeableContent();
		vi.mocked(decrypt).mockResolvedValueOnce(JSON.stringify(changes2));

		await cloneRoomData(sourceRoom, '127.0.0.1:3000', store);

		expect(store.getTable('t2')).toEqual({ r2: { c2: 2 } });

		// 3. Test modern format on a remote host (https)
		store.delTables();
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('encrypted-blob-2'),
		} as Response);

		otherStore.delTables();
		otherStore.setTable('t3', { r3: { c3: 3 } });
		const changes3 = otherStore.getMergeableContent();
		vi.mocked(decrypt).mockResolvedValueOnce(JSON.stringify(changes3));

		await cloneRoomData(sourceRoom, 'example.com', store);

		expect(store.getTable('t3')).toEqual({ r3: { c3: 3 } });
		expect(fetch).toHaveBeenCalledWith(
			'https://example.com/parties/tinybase/hashed-room-id/store',
			expect.any(Object),
		);

		// 4. Test error cases
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
		} as Response);
		await expect(
			cloneRoomData(sourceRoom, 'localhost:3000', store),
		).rejects.toThrow('Failed to fetch room data: Not Found');

		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(''),
		} as Response);
		await expect(
			cloneRoomData(sourceRoom, 'localhost:3000', store),
		).rejects.toThrow('No content found in the source room.');

		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('null'),
		} as Response);
		await expect(
			cloneRoomData(sourceRoom, 'localhost:3000', store),
		).rejects.toThrow('No content found in the source room.');

		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('invalid-encrypted-blob'),
		} as Response);
		vi.mocked(decrypt).mockResolvedValueOnce('invalid-json');
		await expect(
			cloneRoomData(sourceRoom, 'localhost:3000', store),
		).rejects.toThrow('Failed to parse decrypted content.');
	});
});
