import PartySocket from 'partysocket';
import { createStore } from 'tinybase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEncryptionKey, hashRoomId } from '@/utils/crypto';
import { createSecurePartyKitPersister } from './secure-partykit-persister';

vi.mock('partysocket', () => {
	const mockAddEventListener = vi.fn();
	const mockSend = vi.fn();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const MockPartySocket = function (this: any, options: any) {
		this.addEventListener = mockAddEventListener;
		this.removeEventListener = vi.fn();
		this.send = mockSend;
		this.partySocketOptions = options;
	};
	return {
		default: MockPartySocket,
		mockAddEventListener,
		mockSend,
	};
});

describe('migration scenario', () => {
	let store: ReturnType<typeof createStore>;
	let encryptionKey: CryptoKey;
	const roomName = 'existing-room';

	beforeEach(async () => {
		vi.clearAllMocks();
		store = createStore();
		encryptionKey = await getEncryptionKey(roomName);

		// Mock fetch for clean remote store
		global.fetch = vi.fn().mockImplementation(() =>
			Promise.resolve({
				json: () => Promise.resolve({}),
			} as Response),
		);
	});

	it('should migrate existing local data to a new encrypted room', async () => {
		// 1. Simulate existing local data
		store.setCell('diaperChanges', 'row1', 'notes', 'existing note');

		// 2. Setup secure sync (as if user just updated the app)
		const hashedRoomIdValue = await hashRoomId(roomName);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const connection = new (PartySocket as any)({
			host: 'localhost',
			party: 'tinybase',
			room: hashedRoomIdValue,
		});

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		// 3. Load from (empty) remote
		await persister.load();

		// Local data should still be there
		expect(store.getCell('diaperChanges', 'row1', 'notes')).toBe(
			'existing note',
		);

		// 4. Save to remote
		await persister.save();

		// Verify fetch was called with PUT and encrypted data
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const fetchMock = global.fetch as any;
		const putCall = fetchMock.mock.calls.find(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(call: any) => call[1]?.method === 'PUT',
		);
		expect(putCall).toBeDefined();

		const body = JSON.parse(putCall[1].body);
		// Field name should be clear, value should be encrypted
		expect(body[0].diaperChanges.row1.notes).toMatch(/^s:/);
	});
});
