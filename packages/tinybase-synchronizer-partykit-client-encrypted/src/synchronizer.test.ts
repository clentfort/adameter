import { createMergeableStore } from 'tinybase';
import { encryptContent } from 'tinybase-persister-partykit-client-encrypted';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { encrypt, getEncryptionKey, jsonStringWithUndefined } from './crypto';
import {
	createEncryptedPartyKitSynchronizer,
	getStoreUrl,
	loadServerSnapshot,
	saveServerSnapshot,
} from './synchronizer';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock createCustomSynchronizer
const mockCreateCustomSynchronizer = vi.fn();
vi.mock('tinybase/synchronizers', () => ({
	createCustomSynchronizer: (...args: unknown[]) =>
		mockCreateCustomSynchronizer(...args),
}));

async function waitForMockCallCount(
	mock: ReturnType<typeof vi.fn>,
	minimumCallCount: number,
) {
	for (let attempt = 0; attempt < 20; attempt++) {
		if (mock.mock.calls.length >= minimumCallCount) {
			return;
		}

		await new Promise((resolve) => {
			setTimeout(resolve, 10);
		});
	}
}

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

	it('loads and merges legacy encrypted Content snapshots', async () => {
		const encryptedContent = await encryptContent(
			[
				{
					events: {
						remote: {
							startDate: '2026-01-01T00:00:00.000Z',
							title: 'Remote event',
							type: 'point',
						},
					},
				},
				{ profile: JSON.stringify({ name: 'Ada' }) },
			],
			encryptionKey,
		);
		mockFetch.mockResolvedValue({
			headers: { get: () => '"4"' },
			ok: true,
			text: () => Promise.resolve(jsonStringWithUndefined(encryptedContent)),
		});
		const store = createMergeableStore();
		store.setRow('events', 'local', {
			startDate: '2026-01-02T00:00:00.000Z',
			title: 'Local event',
			type: 'point',
		});

		const result = await loadServerSnapshot(
			store,
			'https://example.com/legacy-store',
			encryptionKey,
		);

		expect(result).toBe(true);
		expect(store.getRowIds('events').sort()).toEqual(['local', 'remote']);
		expect(store.hasValue('profile')).toBe(true);
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

	it('sends the loaded snapshot version when saving', async () => {
		const storeUrl = 'https://example.com/versioned-store';
		mockFetch
			.mockResolvedValueOnce({
				headers: { get: () => '"7"' },
				ok: true,
				text: () => Promise.resolve('null'),
			})
			.mockResolvedValueOnce({
				headers: { get: () => '"8"' },
				ok: true,
				status: 200,
			});
		const store = createMockStore();

		await loadServerSnapshot(store as never, storeUrl, encryptionKey);
		await saveServerSnapshot(store as never, storeUrl, encryptionKey);

		expect(mockFetch.mock.calls[1][1].headers).toEqual({
			'If-Match': '"7"',
		});
	});

	it('reloads, merges, and retries after a version conflict', async () => {
		const storeUrl = 'https://example.com/conflicting-store';
		const remoteContent = [[{}, '', ''], [{}, '', ''], ''];
		const encryptedRemote = await encrypt(
			jsonStringWithUndefined(remoteContent),
			encryptionKey,
		);
		mockFetch
			.mockResolvedValueOnce({
				headers: { get: () => '"1"' },
				ok: true,
				text: () => Promise.resolve('null'),
			})
			.mockResolvedValueOnce({
				ok: false,
				status: 412,
			})
			.mockResolvedValueOnce({
				headers: { get: () => '"2"' },
				ok: true,
				text: () => Promise.resolve(encryptedRemote),
			})
			.mockResolvedValueOnce({
				headers: { get: () => '"3"' },
				ok: true,
				status: 200,
			});
		const store = createMockStore();

		await loadServerSnapshot(store as never, storeUrl, encryptionKey);
		await saveServerSnapshot(store as never, storeUrl, encryptionKey);

		expect(store.applyMergeableChanges).toHaveBeenCalledWith(remoteContent);
		expect(mockFetch.mock.calls[3][1].headers).toEqual({
			'If-Match': '"2"',
		});
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

describe('createEncryptedPartyKitSynchronizer', () => {
	let encryptionKey: CryptoKey;

	beforeEach(async () => {
		encryptionKey = await getEncryptionKey('test-room');
		mockCreateCustomSynchronizer.mockClear();
		mockCreateCustomSynchronizer.mockReturnValue({
			destroy: vi.fn(),
		});
	});

	it('initializes and provides send/receive callbacks', async () => {
		const connection = {
			addEventListener: vi.fn(),
			partySocketOptions: { host: 'localhost', room: 'room' },
			readyState: 1, // WebSocket.OPEN
			removeEventListener: vi.fn(),
			send: vi.fn(),
		};

		const store = createMockStore();
		await createEncryptedPartyKitSynchronizer(
			store as never,
			connection as never,
			encryptionKey,
		);

		expect(mockCreateCustomSynchronizer).toHaveBeenCalled();
		const [, send, registerReceive] =
			mockCreateCustomSynchronizer.mock.calls[0];

		// Test send
		await send('client-a', 'req-1', 1, { data: 'payload' });
		await waitForMockCallCount(connection.send as never, 1);
		expect(connection.send).toHaveBeenCalled();
		const sentMsg = connection.send.mock.calls[0][0];
		expect(sentMsg).toContain('client-a\n');

		// Test receive
		const mockReceive = vi.fn();
		registerReceive(mockReceive);
		expect(connection.addEventListener).toHaveBeenCalledWith(
			'message',
			expect.any(Function),
		);
		const listener = connection.addEventListener.mock.calls[0][1];

		const encryptedPayload = await encrypt(
			jsonStringWithUndefined(['req-2', 2, { response: 'ok' }]),
			encryptionKey,
		);
		await listener({ data: `sender-b\n${encryptedPayload}` });

		expect(mockReceive).toHaveBeenCalledWith('sender-b', 'req-2', 2, {
			response: 'ok',
		});
	});

	it('resolves if the open event is missed but readyState changes', async () => {
		vi.useFakeTimers();
		const connection = {
			addEventListener: vi.fn(),
			partySocketOptions: { host: 'localhost', room: 'room' },
			readyState: 0,
			removeEventListener: vi.fn(),
			send: vi.fn(),
		};
		const store = createMockStore();

		const synchronizerPromise = createEncryptedPartyKitSynchronizer(
			store as never,
			connection as never,
			encryptionKey,
		);
		connection.readyState = 1;
		await vi.advanceTimersByTimeAsync(25);

		await expect(synchronizerPromise).resolves.toBeDefined();
		vi.useRealTimers();
	});

	it('handles errors in send and receive', async () => {
		const onIgnoredError = vi.fn();
		const connection = {
			addEventListener: vi.fn(),
			partySocketOptions: { host: 'localhost', room: 'room' },
			readyState: 1,
			send: vi.fn(() => {
				throw new Error('send failed');
			}),
		};

		const store = createMockStore();
		await createEncryptedPartyKitSynchronizer(
			store as never,
			connection as never,
			encryptionKey,
			onIgnoredError,
		);

		const [, send, registerReceive] =
			mockCreateCustomSynchronizer.mock.calls[0];

		// Send error (async)
		await send('client-a', 'req-1', 1, { data: 'payload' });
		await waitForMockCallCount(onIgnoredError, 1);
		expect(onIgnoredError).toHaveBeenCalled();

		// Receive error (invalid data)
		registerReceive(vi.fn());
		const listener = connection.addEventListener.mock.calls[0][1];
		await listener({ data: 'sender-b\ninvalid-encrypted' });
		await waitForMockCallCount(onIgnoredError, 2);
		expect(onIgnoredError).toHaveBeenCalledTimes(2);
	});
});
