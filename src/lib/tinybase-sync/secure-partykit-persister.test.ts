import type { Changes } from 'tinybase';
import PartySocket from 'partysocket';
import { createStore } from 'tinybase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEncryptionKey } from '@/utils/crypto';
import { createSecurePartyKitPersister } from './secure-partykit-persister';

vi.mock('partysocket', () => {
	const mockAddEventListener = vi.fn();
	const mockSend = vi.fn();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const MockPartySocket = function (this: any) {
		this.addEventListener = mockAddEventListener;
		this.removeEventListener = vi.fn();
		this.send = mockSend;
		this.partySocketOptions = { host: 'localhost', room: 'test-room' };
	};
	return {
		default: MockPartySocket,
		mockAddEventListener,
		mockSend,
	};
});

describe('secure-partykit-persister', () => {
	let store: ReturnType<typeof createStore>;
	let encryptionKey: CryptoKey;

	beforeEach(async () => {
		vi.clearAllMocks();
		store = createStore();

		encryptionKey = await getEncryptionKey('test-room');

		// Mock fetch
		global.fetch = vi.fn().mockImplementation(() =>
			Promise.resolve({
				json: () => Promise.resolve({}),
			} as Response),
		);
	});

	it('should encrypt and send changes via WebSocket on incremental save', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const connection = new (PartySocket as any)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		connection.name = 'tinybase';

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		const changes: Changes = [{ table1: { row1: { cell1: 'value1' } } }, {}, 1];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await (persister as any).save(changes);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { mockSend } = (await import('partysocket')) as any;
		expect(mockSend).toHaveBeenCalled();
		const sentMessage = mockSend.mock.calls[0][0];
		expect(sentMessage.startsWith('s')).toBe(true);
		const payload = JSON.parse(sentMessage.slice(1));
		expect(payload[0].table1.row1.cell1).toMatch(/^s:/);
	});

	it('should encrypt and send full content via PUT on initial save', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const connection = new (PartySocket as any)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		connection.name = 'tinybase';

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		store.setCell('table1', 'row1', 'cell1', 'value1');
		await persister.save();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const fetchMock = global.fetch as any;
		const putCall = fetchMock.mock.calls.find(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(call: any) => call[1]?.method === 'PUT',
		);
		expect(putCall).toBeDefined();

		const body = JSON.parse(putCall[1].body);
		expect(body[0].table1.row1.cell1).toMatch(/^s:/);
	});

	it('should load and decrypt data', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const connection = new (PartySocket as any)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		connection.name = 'tinybase';

		const realEncrypted = await (
			await import('@/utils/crypto')
		).encryptContent(
			[
				{
					table1: {
						row1: {
							cell1: 'real-value',
						},
					},
				},
				{},
			],
			encryptionKey,
		);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(global.fetch as any).mockImplementationOnce(() =>
			Promise.resolve({
				json: () => Promise.resolve(realEncrypted),
			}),
		);

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		await persister.load();
		expect(store.getCell('table1', 'row1', 'cell1')).toBe('real-value');
	});

	it('should decrypt incoming messages', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const connection = new (PartySocket as any)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		connection.name = 'tinybase';

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		await persister.startAutoLoad();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { mockAddEventListener } = (await import('partysocket')) as any;
		expect(mockAddEventListener).toHaveBeenCalled();
		const addEventListenerCall = mockAddEventListener.mock.calls[0];
		expect(addEventListenerCall[0]).toBe('message');
		const listener = addEventListenerCall[1];

		const realEncryptedChanges = await (
			await import('@/utils/crypto')
		).encryptChanges(
			[{ table1: { row1: { cell1: 'remote-value' } } }, {}, 1],
			encryptionKey,
		);

		await listener({
			data: 's' + JSON.stringify(realEncryptedChanges),
		});

		expect(store.getCell('table1', 'row1', 'cell1')).toBe('remote-value');
	});
});
