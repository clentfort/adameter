import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cloneRoomData, cloneRoomDataFromHosts } from './cloning';

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

function mockHosts(responses: Record<string, string>) {
	vi.mocked(hashRoomId).mockResolvedValue('hashed-room');
	vi.mocked(getEncryptionKey).mockResolvedValue({} as CryptoKey);
	vi.mocked(decrypt).mockImplementation((body) => Promise.resolve(body));
	vi.mocked(jsonParseWithUndefined).mockImplementation((body) => [
		{ source: body },
		{},
		'0',
		1,
	]);
	vi.mocked(fetch).mockImplementation((url) => {
		const host = new URL(String(url)).host;
		const body = responses[host];
		return Promise.resolve({
			ok: true,
			text: () => Promise.resolve(body ?? 'null'),
		} as Response);
	});
}

function createMockStore() {
	return {
		applyMergeableChanges: vi.fn(),
		setContent: vi.fn(),
	};
}

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

	describe('cloneRoomDataFromHosts', () => {
		it('merges data from every host that has it', async () => {
			mockHosts({ 'legacy.example': 'legacy', 'new.example': 'new' });
			const store = createMockStore();

			await cloneRoomDataFromHosts(
				sourceRoomName,
				['legacy.example', 'new.example'],
				store as unknown as Parameters<typeof cloneRoomDataFromHosts>[2],
			);

			expect(store.applyMergeableChanges).toHaveBeenCalledTimes(2);
		});

		it('succeeds when only the legacy host has data', async () => {
			mockHosts({ 'legacy.example': 'legacy' });
			const store = createMockStore();

			await cloneRoomDataFromHosts(
				sourceRoomName,
				['legacy.example', 'new.example'],
				store as unknown as Parameters<typeof cloneRoomDataFromHosts>[2],
			);

			expect(store.applyMergeableChanges).toHaveBeenCalledTimes(1);
			expect(store.applyMergeableChanges).toHaveBeenCalledWith([
				{ source: 'legacy' },
				{},
				'0',
				1,
			]);
		});

		it('fails when no host has data', async () => {
			mockHosts({});

			await expect(
				cloneRoomDataFromHosts(
					sourceRoomName,
					['legacy.example', 'new.example'],
					createMockStore() as unknown as Parameters<
						typeof cloneRoomDataFromHosts
					>[2],
				),
			).rejects.toThrow('Failed to clone room from any host.');
		});
	});
});
