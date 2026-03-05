import type { Changes } from 'tinybase';
import PartySocket from 'partysocket';
import { createStore } from 'tinybase';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	decryptChanges,
	encryptChanges,
	encryptContent,
	getEncryptionKey,
	hashRoomId,
	jsonParseWithUndefined,
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

describe('createSecurePartyKitPersister', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockResolvedValue({
			json: () => Promise.resolve([{}, {}]),
		} as Response);
	});

	it('encrypts incremental changes before websocket send', async () => {
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

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		const storeState = {
			table1: {
				row1: {
					cell1: 'value1',
				},
			},
		};

		store.setRow('table1', 'row1', storeState.table1.row1);

		const changes: Changes = [{ table1: { row1: { cell1: 'value1' } } }, {}, 1];
		await (
			persister as unknown as { save: (changes: Changes) => Promise<void> }
		).save(changes);

		expect(mockSend).toHaveBeenCalledTimes(1);
		const sentMessage = mockSend.mock.calls[0][0] as string;
		expect(sentMessage.startsWith('s')).toBe(true);
		const payload = JSON.parse(sentMessage.slice(1)) as Changes;
		const tableChanges = payload[0] as {
			table1: {
				row1: {
					d: string;
				};
			};
		};
		expect(tableChanges.table1.row1.d).toMatch(/^s:/);
	});

	it('propagates add, update, and delete changes over websocket', async () => {
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

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		const storeState = {
			table1: {
				row1: {
					addedCell: 'added',
					updatedCell: 7,
				},
			},
		};
		store.setRow('table1', 'row1', storeState.table1.row1);

		const changes: Changes = [
			{
				deletedTable: undefined,
				table1: {
					deletedRow: undefined,
					row1: {
						addedCell: 'added',
						deletedCell: undefined,
						updatedCell: 7,
					},
				},
			},
			{
				addedValue: true,
				deletedValue: undefined,
				updatedValue: 'next',
			},
			1,
		];

		await (
			persister as unknown as { save: (changes: Changes) => Promise<void> }
		).save(changes);

		expect(mockSend).toHaveBeenCalledTimes(1);
		const sentMessage = mockSend.mock.calls[0][0] as string;
		expect(sentMessage.startsWith('s')).toBe(true);
		expect(sentMessage).toContain('\uFFFC');

		const parsed = jsonParseWithUndefined<Changes>(sentMessage.slice(1));
		const decrypted = await decryptChanges(parsed, encryptionKey);
		expect(decrypted[0].table1.row1).toEqual(storeState.table1.row1);
		expect(decrypted[1]).toEqual(changes[1]);
	});

	it('encrypts full content before PUT save', async () => {
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
		const body = JSON.parse(requestOptions.body);
		expect(body[0].table1.row1.d).toMatch(/^s:/);
	});

	it('skips full save until initial load succeeds', async () => {
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

	it('does not overwrite remote content when initial load fails', async () => {
		const store = createStore();
		store.setCell('table1', 'row1', 'cell1', 'local-value');
		const encryptionKey = await getEncryptionKey('test-room');
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: 'test-room',
		});
		(connection as unknown as { name: string }).name = 'tinybase';

		global.fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error('load failed'))
			.mockResolvedValue({ json: () => Promise.resolve([{}, {}]) } as Response);

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		) as StatefulPersister;

		await persister.startAutoLoad();
		await persister.startAutoSave();
		expect(persister.hasLoadedPersistedData()).toBe(false);
		expect(persister.hasSavedFullContent()).toBe(false);

		const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
		const putCall = fetchMock.mock.calls.find(
			(call: unknown[]) => (call[1] as { method?: string })?.method === 'PUT',
		);

		expect(putCall).toBeUndefined();
	});

	it('loads persisted data and decrypts it', async () => {
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

		const encryptedContent = await encryptContent(
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

		global.fetch = vi.fn().mockResolvedValueOnce({
			json: () => Promise.resolve(encryptedContent),
		} as Response);

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		await persister.load();
		expect(store.getCell('table1', 'row1', 'cell1')).toBe('real-value');
	});

	it('decrypts incoming websocket messages', async () => {
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

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		await persister.startAutoLoad();

		expect(mockAddEventListener).toHaveBeenCalledTimes(1);
		const listener = mockAddEventListener.mock.calls[0][1] as (
			event: MessageEvent,
		) => Promise<void>;

		const encryptedChanges = await encryptChanges(
			[{ table1: { row1: { cell1: 'remote-value' } } }, {}, 1],
			encryptionKey,
		);

		await listener({
			data: 's' + JSON.stringify(encryptedChanges),
		} as MessageEvent);

		expect(store.getCell('table1', 'row1', 'cell1')).toBe('remote-value');
	});

	it('applies remote add, update, and delete changes', async () => {
		const store = createStore();
		store.setCell('table1', 'row1', 'deletedCell', 'to-delete');
		store.setCell('table1', 'deletedRow', 'cell', 'to-delete');
		store.setCell('deletedTable', 'row1', 'cell1', 'to-delete');
		store.setValue('deletedValue', 'to-delete');
		store.setValue('updatedValue', 'old');

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
		);

		await persister.startAutoLoad();

		const listener = mockAddEventListener.mock.calls[0][1] as (
			event: MessageEvent,
		) => Promise<void>;

		const remoteChanges: Changes = [
			{
				deletedTable: undefined,
				table1: {
					deletedRow: undefined,
					row1: {
						addedCell: 'new',
						deletedCell: undefined,
						updatedCell: 42,
					},
				},
			},
			{
				addedValue: true,
				deletedValue: undefined,
				updatedValue: 'new',
			},
			1,
		];
		const encryptedChanges = await encryptChanges(remoteChanges, encryptionKey);

		await listener({
			data: 's' + jsonStringWithUndefined(encryptedChanges),
		} as MessageEvent);

		expect(store.getCell('table1', 'row1', 'addedCell')).toBe('new');
		expect(store.getCell('table1', 'row1', 'updatedCell')).toBe(42);
		expect(store.getCell('table1', 'row1', 'deletedCell')).toBeUndefined();
		expect(store.getCell('table1', 'deletedRow', 'cell')).toBeUndefined();
		expect(store.getCell('deletedTable', 'row1', 'cell1')).toBeUndefined();
		expect(store.getValue('addedValue')).toBe(true);
		expect(store.getValue('updatedValue')).toBe('new');
		expect(store.getValue('deletedValue')).toBeUndefined();
	});

	it('calls ignored error callback on malformed message', async () => {
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

		const onIgnoredError = vi.fn();
		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
			onIgnoredError,
		);

		await persister.startAutoLoad();

		const listener = mockAddEventListener.mock.calls[0][1] as (
			event: MessageEvent,
		) => Promise<void>;
		await listener({ data: 'snot-json' } as MessageEvent);

		expect(onIgnoredError).toHaveBeenCalledTimes(1);
	});

	it('saves local data into encrypted room after initial load', async () => {
		const store = createStore();
		const roomName = 'existing-room';
		const encryptionKey = await getEncryptionKey(roomName);
		const hashedRoomId = await hashRoomId(roomName);
		const connection = new (PartySocket as unknown as new (
			options: Record<string, unknown>,
		) => PartySocket)({
			host: 'localhost',
			party: 'tinybase',
			room: hashedRoomId,
		});
		(connection as unknown as { name: string }).name = 'tinybase';

		const persister = createSecurePartyKitPersister(
			store,
			connection,
			encryptionKey,
		);

		await persister.load();
		store.setCell('diaperChanges', 'row1', 'notes', 'existing note');
		await persister.save();

		const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
		const putCall = fetchMock.mock.calls.find(
			(call: unknown[]) => (call[1] as { method?: string })?.method === 'PUT',
		);

		expect(putCall).toBeDefined();
		expect(store.getCell('diaperChanges', 'row1', 'notes')).toBe(
			'existing note',
		);
		const requestOptions = (putCall as unknown[])[1] as {
			body: string;
			method: string;
		};
		const body = JSON.parse(requestOptions.body);
		expect(body[0].diaperChanges.row1.d).toMatch(/^s:/);
	});
});
