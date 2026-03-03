import type { Request, Room, Worker } from 'partykit/server';
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

	async onRequest(request: Request) {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: TINYBASE_CORS_HEADERS,
				status: 204,
			});
		}

		try {
			const response = await super.onRequest(request);
			const headers = new Headers(response.headers);
			for (const [name, value] of Object.entries(TINYBASE_CORS_HEADERS)) {
				headers.set(name, value);
			}
			headers.set('Content-Type', 'application/json');

			if (request.method === 'PUT') {
				return new Response('null', {
					headers,
					status: 200,
				});
			}

			const bodyText = await response.text();
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
