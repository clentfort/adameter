import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { encrypt, getEncryptionKey, jsonStringWithUndefined } from './crypto';
import {
	getStoreUrl,
	loadServerSnapshot,
	saveServerSnapshot,
} from './synchronizer';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Minimal mock store
function createMockStore() {
	let mergedChanges: unknown = null;
	const content = [
		[
			{ table1: { row1: [{ cell1: ['hello', 'ts1', 'hash1'] }, '', 'hash2'] } },
			'',
			'hash3',
		],
		[{}, '', 'hash4'],
		'hash5',
	];

	return {
		applyMergeableChanges: vi.fn((changes: unknown) => {
			mergedChanges = changes;
		}),
		getLastMerged: () => mergedChanges,
		getMergeableContent: vi.fn(() => content),
	};
}

describe('getStoreUrl', () => {
	it('builds https URL for production host', () => {
		const connection = {
			name: 'tinybase',
			partySocketOptions: {
				host: 'my-project.account.partykit.dev',
				room: 'abc123',
			},
		};

		const url = getStoreUrl(connection as never);
		expect(url).toBe(
			'https://my-project.account.partykit.dev/parties/tinybase/abc123/store',
		);
	});

	it('builds http URL for localhost', () => {
		const connection = {
			name: 'tinybase',
			partySocketOptions: {
				host: 'localhost:1999',
				room: 'abc123',
			},
		};

		const url = getStoreUrl(connection as never);
		expect(url).toBe('http://localhost:1999/parties/tinybase/abc123/store');
	});

	it('builds http URL for 127.0.0.1', () => {
		const connection = {
			name: 'tinybase',
			partySocketOptions: {
				host: '127.0.0.1:1999',
				room: 'test-room',
			},
		};

		const url = getStoreUrl(connection as never);
		expect(url).toBe('http://127.0.0.1:1999/parties/tinybase/test-room/store');
	});
});

describe('loadServerSnapshot', () => {
	let encryptionKey: CryptoKey;

	beforeEach(async () => {
		encryptionKey = await getEncryptionKey('test-room');
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('throws when server responds with non-ok status', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
			text: () => Promise.resolve('{"error":"boom"}'),
		});
		const store = createMockStore();

		await expect(
			loadServerSnapshot(
				store as never,
				'https://example.com/store',
				encryptionKey,
			),
		).rejects.toThrow('Snapshot GET failed (500): {"error":"boom"}');
		expect(store.applyMergeableChanges).not.toHaveBeenCalled();
	});

	it('returns false when response body is empty', async () => {
		mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('') });
		const store = createMockStore();

		const result = await loadServerSnapshot(
			store as never,
			'https://example.com/store',
			encryptionKey,
		);

		expect(result).toBe(false);
		expect(store.applyMergeableChanges).not.toHaveBeenCalled();
	});

	it('returns false when response body is "null"', async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			text: () => Promise.resolve('null'),
		});
		const store = createMockStore();

		const result = await loadServerSnapshot(
			store as never,
			'https://example.com/store',
			encryptionKey,
		);

		expect(result).toBe(false);
		expect(store.applyMergeableChanges).not.toHaveBeenCalled();
	});

	it('decrypts and applies mergeable content to the store', async () => {
		const mergeableContent = [
			[
				{ table1: { row1: [{ cell1: ['value', 'ts', 'hash'] }, '', ''] } },
				'',
				'',
			],
			[{}, '', ''],
			'',
		];
		const serialized = jsonStringWithUndefined(mergeableContent);
		const encrypted = await encrypt(serialized, encryptionKey);

		mockFetch.mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(encrypted),
		});

		const store = createMockStore();
		const result = await loadServerSnapshot(
			store as never,
			'https://example.com/store',
			encryptionKey,
		);

		expect(result).toBe(true);
		expect(store.applyMergeableChanges).toHaveBeenCalledOnce();
		expect(store.applyMergeableChanges).toHaveBeenCalledWith(mergeableContent);
	});

	it('passes correct fetch options', async () => {
		mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve('') });
		const store = createMockStore();

		await loadServerSnapshot(
			store as never,
			'https://example.com/store',
			encryptionKey,
		);

		expect(mockFetch).toHaveBeenCalledWith('https://example.com/store', {
			cache: 'no-store',
			mode: 'cors',
		});
	});
});

describe('saveServerSnapshot', () => {
	let encryptionKey: CryptoKey;

	beforeEach(async () => {
		encryptionKey = await getEncryptionKey('test-room');
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('encrypts store content and PUTs it to the server', async () => {
		mockFetch.mockResolvedValue({ ok: true });
		const store = createMockStore();

		await saveServerSnapshot(
			store as never,
			'https://example.com/store',
			encryptionKey,
		);

		expect(store.getMergeableContent).toHaveBeenCalledOnce();
		expect(mockFetch).toHaveBeenCalledOnce();

		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toBe('https://example.com/store');
		expect(options.method).toBe('PUT');
		expect(options.cache).toBe('no-store');
		expect(options.mode).toBe('cors');
		expect(typeof options.body).toBe('string');
		expect(options.body.length).toBeGreaterThan(0);
	});

	it('throws when PUT snapshot fails', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 500,
			statusText: 'Internal Server Error',
			text: () => Promise.resolve('{"error":"too large"}'),
		});
		const store = createMockStore();

		await expect(
			saveServerSnapshot(
				store as never,
				'https://example.com/store',
				encryptionKey,
			),
		).rejects.toThrow('Snapshot PUT failed (500): {"error":"too large"}');
	});
});
