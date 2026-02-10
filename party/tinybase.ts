import type { Request, Room, Worker } from 'partykit/server';
import {
	broadcastChanges,
	TinyBasePartyKitServer,
} from 'tinybase/persisters/persister-partykit-server';

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

	async onRequest(request: Request) {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: TINYBASE_CORS_HEADERS,
				status: 204,
			});
		}

		try {
			const headers = new Headers(TINYBASE_CORS_HEADERS);
			headers.set('Content-Type', 'application/json');

			if (request.method === 'PUT') {
				const body = await request.text();
				const response = await super.onRequest(
					new Request(request.url, {
						body,
						headers: request.headers,
						method: 'PUT',
					}),
				);

				if (response.ok) {
					try {
						const changes = JSON.parse(body);
						await broadcastChanges(this, changes);
					} catch {
						// Ignore parse errors for broadcasting
					}
				}

				return new Response('null', { headers, status: response.status });
			}

			const response = await super.onRequest(request);
			const bodyText = await response.text();

			return new Response(bodyText.length > 0 ? bodyText : '[{}, {}]', {
				headers,
				status: response.status,
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
