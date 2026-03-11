import PartySocket from 'partysocket';
import { createMergeableStore } from 'tinybase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEncryptionKey } from './crypto';
import { createSecurePartyKitPersister } from './persister-partykit-client-encrypted';

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
	const original = (await importOriginal()) as Record<string, unknown>;
	return {
		...original,
		decryptMergeableContent: vi.fn(async (content: unknown) => content),
		encryptMergeableContent: vi.fn(async (content: unknown) =>
			typeof content === 'string' ? content : JSON.stringify(content),
		),
	};
});

describe('createSecurePartyKitPersister data loss', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('does not lose local changes made during slow remote load', async () => {
		const store = createMergeableStore('local');
		const encryptionKey = await getEncryptionKey('test-room');
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		(connection as unknown as { name: string }).name = 'tinybase';

		const remoteStore = createMergeableStore('remote');
		remoteStore.setCell('table1', 'row-remote', 'cell1', 'remote-value');
		const remoteContent = remoteStore.getMergeableContent();

		// Simulate slow network for load
		global.fetch = vi.fn().mockImplementation(async (url) => {
			if (url.includes('/mergeable-store') && !url.includes('method=PUT')) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				return {
					json: () => Promise.resolve(remoteContent),
				} as Response;
			}
			return {
				json: () => Promise.resolve({}),
			} as Response;
		});

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		// Start loading
		const loadPromise = persister.load();

		// Make a local change while loading
		await new Promise((resolve) => setTimeout(resolve, 50));
		store.setCell('table1', 'row-local', 'cell1', 'local-value');

		// Wait for load to finish
		await loadPromise;

		// Check if local change is still there
		expect(store.getCell('table1', 'row-local', 'cell1')).toBe('local-value');
		expect(store.getCell('table1', 'row-remote', 'cell1')).toBe('remote-value');
	});
});
