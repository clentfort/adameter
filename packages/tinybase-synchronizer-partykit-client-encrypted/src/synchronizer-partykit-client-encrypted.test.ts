import { createMergeableStore } from 'tinybase';
import PartySocket from 'partysocket';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEncryptionKey } from './crypto';
import { createSecurePartyKitSynchronizer } from './synchronizer-partykit-client-encrypted';

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

describe('createSecurePartyKitSynchronizer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('encrypts sync messages before sending', async () => {
		const store = createMergeableStore();
		const encryptionKey = await getEncryptionKey('test-room');
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});

		const synchronizer = createSecurePartyKitSynchronizer(
			store,
			connection,
			encryptionKey,
		);

		await synchronizer.startSync();

		// TinyBase should send initial sync message
		expect(mockSend).toHaveBeenCalled();
		const sentMessage = mockSend.mock.calls[0][0] as string;
		expect(sentMessage.startsWith('y')).toBe(true);
	});

	it('decrypts incoming sync messages', async () => {
		const store = createMergeableStore();
		const encryptionKey = await getEncryptionKey('test-room');
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});

		const synchronizer = createSecurePartyKitSynchronizer(
			store,
			connection,
			encryptionKey,
		);

		await synchronizer.startSync();

		expect(mockAddEventListener).toHaveBeenCalledWith(
			'message',
			expect.any(Function),
		);
		const listener = mockAddEventListener.mock.calls[0][1];

		// Simulate another client's message
		// Payload: [fromClientId, toClientId, requestId, message, body]
		// Message.GetContentHashes = 1
		const payload = ['other-client', null, 'request-1', 1, null];
		const { encryptValue } = await import('./crypto');
		const encrypted = await encryptValue(JSON.stringify(payload), encryptionKey);

		await listener({
			data: 'y' + encrypted,
		} as MessageEvent);

		// If it reached the synchronizer, it should have triggered a response
		// (Wait for async processing)
		await new Promise(resolve => setTimeout(resolve, 100));

		// Should have sent a response (more than once due to initial sync messages)
		expect(mockSend.mock.calls.length).toBeGreaterThan(1);
	});
});
