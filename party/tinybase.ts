import type { Connection, Request, Room, Worker } from 'partykit/server';
import {
	broadcastChanges,
	hasStoreInStorage,
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

			const headers = new Headers(response.headers);
			for (const [name, value] of Object.entries(TINYBASE_CORS_HEADERS)) {
				headers.set(name, value);
			}
			headers.set('Content-Type', 'application/json');

			return new Response('null', { headers, status: response.status });
		}

		const response = await super.onRequest(request);
		const bodyText = await response.text();
		const headers = new Headers(response.headers);
		for (const [name, value] of Object.entries(TINYBASE_CORS_HEADERS)) {
			headers.set(name, value);
		}
		headers.set('Content-Type', 'application/json');

		return new Response(bodyText.length > 0 ? bodyText : '[{}, {}]', {
			headers,
			status: response.status,
		});
	}

	async onMessage(message: string, connection: Connection) {
		const {
			config: { storagePrefix = '' },
		} = this;
		if (!(await hasStoreInStorage(this.party.storage, storagePrefix))) {
			await this.party.storage.put(storagePrefix + 'hasStore', 1);
		}
		await super.onMessage(message, connection);
	}
}

TinybasePartyServer satisfies Worker;
