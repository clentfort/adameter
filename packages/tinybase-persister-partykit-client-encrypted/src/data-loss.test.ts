import type { Content } from 'tinybase';
import PartySocket from 'partysocket';
import { createStore } from 'tinybase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encryptContent, getEncryptionKey } from './crypto';
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

describe('Data loss reproduction', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should not lose local changes made during a slow load', async () => {
		const store = createStore();
		const encryptionKey = await getEncryptionKey('test-room');
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		(connection as unknown as { name: string }).name = 'tinybase';

		const remoteContent: Content = [
			{ table1: { row1: { cell1: 'remote-value' } } },
			{},
		];
		const encryptedRemoteContent = await encryptContent(remoteContent, encryptionKey);

		// Mock a slow fetch for the load operation
		let resolveLoad: (value: any) => void;
		const loadPromise = new Promise((resolve) => {
			resolveLoad = resolve;
		});

		global.fetch = vi.fn().mockImplementation((url: string) => {
			if (url.includes('/store') && !url.includes('method: "PUT"')) {
				return loadPromise;
			}
			return Promise.resolve({
				json: () => Promise.resolve([{}, {}]),
			} as Response);
		});

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		// Start loading
		const loadFinishedPromise = persister.load();

		// While loading, make a local change
		store.setCell('table1', 'row2', 'cell2', 'local-value');
		expect(store.getCell('table1', 'row2', 'cell2')).toBe('local-value');

		// Now resolve the load with the remote content
		resolveLoad!({
			json: () => Promise.resolve(encryptedRemoteContent),
			ok: true,
		});

		const result = await loadFinishedPromise;

		// Verify fluent API identity
		expect(result).toBe(persister);

		// The remote content should be merged or applied, but row2 should NOT be lost
		expect(store.getCell('table1', 'row1', 'cell1')).toBe('remote-value');

		// This is the expected behavior we want to verify (and currently might be failing)
		expect(store.getCell('table1', 'row2', 'cell2')).toBe('local-value');
	});
});
