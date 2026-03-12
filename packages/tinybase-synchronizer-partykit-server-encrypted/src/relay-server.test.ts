import type { Request as PartyRequest } from 'partykit/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EncryptedSyncRelayServer } from './relay-server';

function createMockSend() {
	return vi.fn<(message: string) => void>();
}

function createMockRoom() {
	const connections = new Map<
		string,
		{ id: string; send: ReturnType<typeof createMockSend> }
	>();

	const broadcast = vi.fn<(message: string, exclude?: string[]) => void>();
	broadcast.mockImplementation((message: string, exclude?: string[]) => {
		for (const [id, conn] of connections) {
			if (!exclude?.includes(id)) {
				conn.send(message);
			}
		}
	});

	const storageGet = vi.fn<() => Promise<string | undefined>>();
	const storagePut = vi.fn<() => Promise<void>>();

	return {
		addConnection(id: string) {
			const conn = { id, send: createMockSend() };
			connections.set(id, conn);
			return conn;
		},
		broadcast,
		getConnections: () => connections.values(),
		storage: { get: storageGet, put: storagePut },
	};
}

function createRequest(
	method: string,
	path: string,
	body?: string,
): PartyRequest {
	return {
		method,
		text: () => Promise.resolve(body ?? ''),
		url: `https://example.com${path}`,
	} as unknown as PartyRequest;
}

describe('EncryptedSyncRelayServer', () => {
	let room: ReturnType<typeof createMockRoom>;
	let server: EncryptedSyncRelayServer;

	beforeEach(() => {
		room = createMockRoom();
		server = new EncryptedSyncRelayServer(room as never);
	});

	describe('onRequest', () => {
		it('returns 204 for OPTIONS (CORS preflight)', async () => {
			const response = await server.onRequest(
				createRequest('OPTIONS', '/store'),
			);
			expect(response.status).toBe(204);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		});

		it('returns 404 for non-store paths', async () => {
			const response = await server.onRequest(createRequest('GET', '/other'));
			expect(response.status).toBe(404);
		});

		it('returns "null" when no snapshot exists (GET /store)', async () => {
			room.storage.get.mockResolvedValue(undefined);

			const response = await server.onRequest(createRequest('GET', '/store'));
			expect(response.status).toBe(200);
			expect(await response.text()).toBe('null');
			expect(response.headers.get('Content-Type')).toBe('text/plain');
		});

		it('returns stored snapshot (GET /store)', async () => {
			room.storage.get.mockResolvedValue('encrypted-data-here');

			const response = await server.onRequest(createRequest('GET', '/store'));
			expect(response.status).toBe(200);
			expect(await response.text()).toBe('encrypted-data-here');
		});

		it('stores snapshot (PUT /store)', async () => {
			const response = await server.onRequest(
				createRequest('PUT', '/store', 'new-encrypted-snapshot'),
			);
			expect(response.status).toBe(200);
			expect(room.storage.put).toHaveBeenCalledWith(
				'snapshot',
				'new-encrypted-snapshot',
			);
		});

		it('returns 405 for unsupported methods', async () => {
			const response = await server.onRequest(
				createRequest('DELETE', '/store'),
			);
			expect(response.status).toBe(405);
		});

		it('returns 500 on storage error', async () => {
			room.storage.get.mockRejectedValue(new Error('storage down'));

			const response = await server.onRequest(createRequest('GET', '/store'));
			expect(response.status).toBe(500);
			const body = JSON.parse(await response.text());
			expect(body.error).toContain('storage down');
		});
	});

	describe('onMessage', () => {
		it('broadcasts to all except sender when toClientId is empty', () => {
			const sender = room.addConnection('sender-1');
			const clientA = room.addConnection('client-a');
			const clientB = room.addConnection('client-b');

			server.onMessage('\nencrypted-payload', sender as never);

			expect(room.broadcast).toHaveBeenCalledWith(
				'sender-1\nencrypted-payload',
				['sender-1'],
			);
			expect(clientA.send).toHaveBeenCalledWith('sender-1\nencrypted-payload');
			expect(clientB.send).toHaveBeenCalledWith('sender-1\nencrypted-payload');
		});

		it('sends direct message to specific client', () => {
			const sender = room.addConnection('sender-1');
			const target = room.addConnection('target-1');
			const bystander = room.addConnection('bystander');

			server.onMessage('target-1\nencrypted-payload', sender as never);

			expect(target.send).toHaveBeenCalledWith('sender-1\nencrypted-payload');
			expect(bystander.send).not.toHaveBeenCalled();
		});

		it('ignores messages without separator', () => {
			const sender = room.addConnection('sender-1');
			room.addConnection('client-a');

			server.onMessage('no-separator-here', sender as never);

			expect(room.broadcast).not.toHaveBeenCalled();
		});

		it('ignores non-string messages', () => {
			const sender = room.addConnection('sender-1');

			server.onMessage(new ArrayBuffer(10), sender as never);

			expect(room.broadcast).not.toHaveBeenCalled();
		});
	});

	describe('config', () => {
		it('uses custom storePath', async () => {
			server = new EncryptedSyncRelayServer(room as never);
			Object.defineProperty(server, 'config', {
				value: { storePath: '/my-store' },
			});

			room.storage.get.mockResolvedValue('data');

			const hitResponse = await server.onRequest(
				createRequest('GET', '/my-store'),
			);
			expect(hitResponse.status).toBe(200);

			const missResponse = await server.onRequest(
				createRequest('GET', '/store'),
			);
			expect(missResponse.status).toBe(404);
		});

		it('uses custom responseHeaders', async () => {
			server = new EncryptedSyncRelayServer(room as never);
			Object.defineProperty(server, 'config', {
				value: {
					responseHeaders: {
						'Access-Control-Allow-Origin': 'https://myapp.com',
					},
				},
			});

			const response = await server.onRequest(
				createRequest('OPTIONS', '/store'),
			);
			expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
				'https://myapp.com',
			);
		});
	});
});
