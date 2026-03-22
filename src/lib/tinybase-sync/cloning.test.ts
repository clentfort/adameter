import type { MergeableStore } from 'tinybase';
import { decryptContent } from 'tinybase-persister-partykit-client-encrypted';
import {
	decrypt,
	getEncryptionKey,
	hashRoomId,
	jsonParseWithUndefined,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneRoomData } from './cloning';

vi.mock('tinybase-persister-partykit-client-encrypted');
vi.mock('tinybase-synchronizer-partykit-client-encrypted');

describe('cloneRoomData', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		global.fetch = vi.fn();
	});

	it('should handle all logical paths including legacy format, new format, and error cases', async () => {
		const store = {
			applyMergeableChanges: vi.fn(),
			getContent: vi.fn().mockReturnValue([{}, {}]),
			getTables: vi.fn(),
			setContent: vi.fn(),
		} as unknown as MergeableStore;
		const sourceRoomName = 'room1';
		const sourceHost = 'localhost:3000';
		const encryptionKey = 'key';
		const hashedRoomId = 'hashed';

		vi.mocked(hashRoomId).mockResolvedValue(hashedRoomId);
		vi.mocked(getEncryptionKey).mockResolvedValue(
			encryptionKey as unknown as CryptoKey,
		);

		// 1. Fetch failure
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
		} as Response);

		await expect(
			cloneRoomData(sourceRoomName, sourceHost, store),
		).rejects.toThrow('Failed to fetch room data: Not Found');

		// 2. Empty body or 'null'
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('null'),
		} as Response);

		await expect(
			cloneRoomData(sourceRoomName, sourceHost, store),
		).rejects.toThrow('No content found in the source room.');

		// 3. Legacy format (starts with '[')
		const legacyContent = [{}, {}];
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(JSON.stringify(legacyContent)),
		} as Response);
		vi.mocked(decryptContent).mockResolvedValueOnce(
			legacyContent as unknown as Parameters<typeof decryptContent>[0],
		);

		await cloneRoomData(sourceRoomName, sourceHost, store);
		expect(store.setContent).toHaveBeenCalledWith(legacyContent);
		expect(fetch).toHaveBeenCalledWith(
			'http://localhost:3000/parties/tinybase/hashed/store',
			expect.anything(),
		);

		// 4. New format (encrypted blob)
		const encryptedBlob = 'encrypted-blob';
		const decryptedContent = { some: 'changes' };
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(encryptedBlob),
		} as Response);
		vi.mocked(decrypt).mockResolvedValueOnce('decrypted-json');
		vi.mocked(jsonParseWithUndefined).mockReturnValueOnce(decryptedContent);

		await cloneRoomData(sourceRoomName, sourceHost, store);
		expect(store.applyMergeableChanges).toHaveBeenCalledWith(decryptedContent);

		// 5. New format - failed parse
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(encryptedBlob),
		} as Response);
		vi.mocked(decrypt).mockResolvedValueOnce('decrypted-json');
		vi.mocked(jsonParseWithUndefined).mockReturnValueOnce(undefined);

		await expect(
			cloneRoomData(sourceRoomName, sourceHost, store),
		).rejects.toThrow('Failed to parse decrypted content.');

		// 6. Production host (https)
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(encryptedBlob),
		} as Response);
		vi.mocked(decrypt).mockResolvedValueOnce('decrypted-json');
		vi.mocked(jsonParseWithUndefined).mockReturnValueOnce(decryptedContent);

		await cloneRoomData(sourceRoomName, 'example.com', store);
		expect(fetch).toHaveBeenLastCalledWith(
			'https://example.com/parties/tinybase/hashed/store',
			expect.anything(),
		);
	});
});
