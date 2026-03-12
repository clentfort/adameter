import type {
	Connection,
	ConnectionContext,
	Request,
	Room,
	Server,
	Worker,
} from 'partykit/server';

const CORS_HEADERS: Record<string, string> = {
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
	'Access-Control-Allow-Origin': '*',
};

const MESSAGE_SEPARATOR = '\n';

/**
 * PartyKit server that acts as a relay for the encrypted TinyBase synchronizer.
 *
 * - WebSocket messages are forwarded between clients without decryption.
 *   The server sees only opaque ciphertext and routes based on the plaintext
 *   client-ID prefix.
 * - An HTTP GET/PUT /store endpoint stores an encrypted MergeableContent
 *   snapshot so new clients can bootstrap when no other peers are online.
 */
export default class TinybaseSyncRelay implements Server {
	constructor(readonly room: Room) {}

	async onRequest(request: Request): Promise<Response> {
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: CORS_HEADERS, status: 204 });
		}

		const url = new URL(request.url);
		if (!url.pathname.endsWith('/store')) {
			return new Response('Not found', { status: 404 });
		}

		try {
			if (request.method === 'GET') {
				const snapshot = await this.room.storage.get<string>('snapshot');
				return new Response(snapshot ?? 'null', {
					headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain' },
					status: 200,
				});
			}

			if (request.method === 'PUT') {
				const body = await request.text();
				await this.room.storage.put('snapshot', body);
				return new Response('ok', {
					headers: CORS_HEADERS,
					status: 200,
				});
			}

			return new Response('Method not allowed', { status: 405 });
		} catch (error) {
			return new Response(JSON.stringify({ error: String(error) }), {
				headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
				status: 500,
			});
		}
	}

	onConnect(connection: Connection, _ctx: ConnectionContext): void {
		// Nothing to do on connect — clients sync with each other
		void connection;
	}

	onMessage(message: string | ArrayBuffer, sender: Connection): void {
		if (typeof message !== 'string') return;

		const splitAt = message.indexOf(MESSAGE_SEPARATOR);
		if (splitAt === -1) return;

		// The plaintext prefix before the newline is the target client ID.
		// Everything after is encrypted — we relay it opaquely.
		const toClientId = message.slice(0, splitAt);
		const encryptedRemainder = message.slice(splitAt); // includes the \n

		// Prepend the sender's connection ID so receivers know who sent it.
		const forwardedPayload = sender.id + encryptedRemainder;

		if (toClientId === '') {
			// Broadcast to all except sender
			this.room.broadcast(forwardedPayload, [sender.id]);
		} else {
			// Direct message to a specific client
			for (const conn of this.room.getConnections()) {
				if (conn.id === toClientId) {
					conn.send(forwardedPayload);
					break;
				}
			}
		}
	}
}

TinybaseSyncRelay satisfies Worker;
