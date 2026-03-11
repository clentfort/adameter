import type { Connection, Request, Room, Worker } from 'partykit/server';
import { TinyBasePartyKitServer } from 'tinybase/persisters/persister-partykit-server';

const TINYBASE_CORS_HEADERS = {
	'Access-Control-Allow-Headers': '*',
	'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
	'Access-Control-Allow-Origin': '*',
};

export default class TinybasePartyServer extends TinyBasePartyKitServer {
	constructor(readonly room: Room) {
		super(room);
		this.config.responseHeaders = TINYBASE_CORS_HEADERS;
	}

	async onMessage(message: string, connection: Connection) {
		if (message.startsWith('y')) {
			this.room.broadcast(message, [connection.id]);
			return;
		}
		await super.onMessage(message, connection);
	}

	async onRequest(request: Request) {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: TINYBASE_CORS_HEADERS,
				status: 204,
			});
		}

		const url = new URL(request.url);
		if (url.pathname.endsWith('/mergeable-store')) {
			const storage = this.room.storage;
			if (request.method === 'PUT') {
				const body = await request.text();
				await storage.put('mergeable_store', body);
				return new Response('null', {
					headers: TINYBASE_CORS_HEADERS,
					status: 200,
				});
			}
			if (request.method === 'GET') {
				const data = await storage.get<string>('mergeable_store');
				return new Response(data || 'null', {
					headers: TINYBASE_CORS_HEADERS,
					status: 200,
				});
			}
		}

		try {
			const response = await super.onRequest(request);
			const headers = new Headers(response.headers);
			for (const [name, value] of Object.entries(TINYBASE_CORS_HEADERS)) {
				headers.set(name, value);
			}
			headers.set('Content-Type', 'application/json');

			const bodyText = await response.text();
			if (request.method === 'PUT') {
				return new Response(bodyText || 'null', {
					headers,
					status:
						response.status === 201 || response.status === 205
							? 200
							: response.status,
				});
			}

			if (bodyText.length > 0) {
				return new Response(bodyText, {
					headers,
					status: response.status,
				});
			}

			return new Response('[{}, {}]', {
				headers,
				status: 200,
			});
		} catch (error) {
			return new Response(JSON.stringify({ error: String(error) }), {
				headers: {
					...TINYBASE_CORS_HEADERS,
					'Content-Type': 'application/json',
				},
				status: 500,
			});
		}
	}
}

TinybasePartyServer satisfies Worker;
