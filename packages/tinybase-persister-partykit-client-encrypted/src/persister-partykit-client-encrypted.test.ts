import type { MergeableContent } from 'tinybase';
import PartySocket from 'partysocket';
import { createMergeableStore } from 'tinybase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	getEncryptionKey,
	hashRoomId,
	encryptMergeableContent,
	jsonStringWithUndefined,
} from './crypto';
import { createSecurePartyKitPersister } from './persister-partykit-client-encrypted';

type StatefulPersister = ReturnType<typeof createSecurePartyKitPersister> & {
	hasLoadedPersistedData: () => boolean;
	hasSavedFullContent: () => boolean;
};

const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
const mockSend = vi.fn();

function MockPartySocket(this: Record<string, unknown>, options: unknown) {
	this.addEventListener = mockAddEventListener;
	this.removeEventListener = mockRemoveEventListener;
	this.send = mockSend;
	this.partySocketOptions = options;
}

vi.mock('partysocket', () => {
	return {
		default: MockPartySocket,
	};
});

vi.mock('./crypto', async (importOriginal) => {
	const original = (await importOriginal()) as any;
	return {
		...original,
		decryptMergeableContent: vi.fn(async (content) => content),
		encryptMergeableContent: vi.fn(async (content) =>
			typeof content === 'string' ? content : JSON.stringify(content),
		),
	};
});

describe('createSecurePartyKitPersister', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve('encrypted-blob'),
		} as Response);
	});

	it('encrypts full content before PUT save', async () => {
		const store = createMergeableStore();
		const encryptionKey = await getEncryptionKey('test-room');
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		(connection as unknown as { name: string }).name = 'tinybase';

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		) as StatefulPersister;

		expect(persister.hasLoadedPersistedData()).toBe(false);
		expect(persister.hasSavedFullContent()).toBe(false);
		await persister.load();
		expect(persister.hasLoadedPersistedData()).toBe(true);
		store.setCell('table1', 'row1', 'cell1', 'value1');
		await persister.save();
		expect(persister.hasSavedFullContent()).toBe(true);

		const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
		const putCall = fetchMock.mock.calls.find(
			(call: unknown[]) => (call[1] as { method?: string })?.method === 'PUT',
		);

		expect(putCall).toBeDefined();
		const requestOptions = (putCall as unknown[])[1] as {
			body: string;
			method: string;
		};
		// The body should be a JSON-stringified encrypted blob
		expect(requestOptions.body).toMatch(/^"/);
	});

	it('skips full save until initial load succeeds', async () => {
		const store = createMergeableStore();
		const encryptionKey = await getEncryptionKey('test-room');
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		(connection as unknown as { name: string }).name = 'tinybase';

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		) as StatefulPersister;

		expect(persister.hasLoadedPersistedData()).toBe(false);
		expect(persister.hasSavedFullContent()).toBe(false);
		store.setCell('table1', 'row1', 'cell1', 'value1');
		await persister.save();
		expect(persister.hasSavedFullContent()).toBe(false);

		const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
		const putCall = fetchMock.mock.calls.find(
			(call: unknown[]) => (call[1] as { method?: string })?.method === 'PUT',
		);

		expect(putCall).toBeUndefined();
	});

	it('loads persisted data and decrypts it', async () => {
		const store = createMergeableStore();
		const encryptionKey = await getEncryptionKey('test-room');
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		(connection as unknown as { name: string }).name = 'tinybase';

		const content = store.getMergeableContent();
		const encryptedContent = await encryptMergeableContent(content, encryptionKey);

		global.fetch = vi.fn().mockResolvedValueOnce({
			json: () => Promise.resolve(encryptedContent),
		} as Response);

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		await persister.load();
		expect(persister.getStore()).toBe(store);
	});
});
