import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneRoomData } from './cloning';

vi.mock('tinybase-persister-partykit-client-encrypted', () => ({
	decryptContent: vi.fn(),
}));

vi.mock('tinybase-synchronizer-partykit-client-encrypted', () => ({
	decrypt: vi.fn(),
	getEncryptionKey: vi.fn(),
	hashRoomId: vi.fn(),
	jsonParseWithUndefined: vi.fn(),
}));

const { decrypt, getEncryptionKey, hashRoomId, jsonParseWithUndefined } =
	await import('tinybase-synchronizer-partykit-client-encrypted');

const { decryptContent } =
	await import('tinybase-persister-partykit-client-encrypted');

describe('cloneRoomData', () => {
	const sourceRoomName = 'test-room';

	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('fetch', vi.fn());
	});

	it('handles various formats and error conditions', async () => {
		const mockHashedRoomId = 'hashed-room';
		const mockEncryptionKey = {} as CryptoKey;
		vi.mocked(hashRoomId).mockResolvedValue(mockHashedRoomId);
		vi.mocked(getEncryptionKey).mockResolvedValue(mockEncryptionKey);

		// 1. Success - New synchronizer format (non-JSON body)
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('encrypted-blob'),
		} as Response);
		vi.mocked(decrypt).mockResolvedValueOnce('decrypted');
		vi.mocked(jsonParseWithUndefined).mockReturnValueOnce([{}, {}, '0', 1]);

		const mockStore = {
			applyMergeableChanges: vi.fn(),
			setContent: vi.fn(),
		};

		await cloneRoomData(
			sourceRoomName,
			'localhost:1234',
			mockStore as unknown as Parameters<typeof cloneRoomData>[2],
		);
		expect(mockStore.applyMergeableChanges).toHaveBeenCalled();

		// 2. Success - Old persister format (JSON body)
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('[{}, {}]'),
		} as Response);
		vi.mocked(decryptContent).mockResolvedValueOnce([{}, {}]);

		await cloneRoomData(
			sourceRoomName,
			'remote-host.com',
			mockStore as unknown as Parameters<typeof cloneRoomData>[2],
		);
		expect(mockStore.setContent).toHaveBeenCalled();

		// 3. Error - Not OK response
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: false,
			statusText: 'Not Found',
		} as Response);
		await expect(
			cloneRoomData(
				sourceRoomName,
				'host',
				mockStore as unknown as Parameters<typeof cloneRoomData>[2],
			),
		).rejects.toThrow(/Failed to fetch/);

		// 4. Error - Empty body
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(''),
		} as Response);
		await expect(
			cloneRoomData(
				sourceRoomName,
				'host',
				mockStore as unknown as Parameters<typeof cloneRoomData>[2],
			),
		).rejects.toThrow(/No content found/);

		// 5. Error - Parse failure
		vi.mocked(fetch).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve('encrypted'),
		} as Response);
		vi.mocked(decrypt).mockResolvedValueOnce('decrypted');
		vi.mocked(jsonParseWithUndefined).mockReturnValueOnce(null);
		await expect(
			cloneRoomData(
				sourceRoomName,
				'host',
				mockStore as unknown as Parameters<typeof cloneRoomData>[2],
			),
		).rejects.toThrow(/Failed to parse/);
	});
});
