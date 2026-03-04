import type { Request, Room, Worker } from 'partykit/server';
import { TinyBasePartyKitServer } from 'tinybase/persisters/persister-partykit-server';
import { jsonParseWithUndefined } from '../packages/tinybase-persister-partykit-client-encrypted/src/crypto';

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

	async onMessage(message: string, connection: any) {
		const {
			config: { messagePrefix = '' },
		} = this;
		if (message.startsWith(messagePrefix + 's')) {
			const payload = jsonParseWithUndefined(
				message.slice(messagePrefix.length + 1),
			);
			// @ts-ignore
			await this.saveStore(payload, false, connection);
			// @ts-ignore
			this.broadcastChanges(payload, [connection.id]);
		} else {
			await super.onMessage(message, connection);
		}
	}

	async onRequest(request: Request) {
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: TINYBASE_CORS_HEADERS,
				status: 204,
			});
		}

		if (request.method === 'PUT') {
			const bodyText = await request.text();
			try {
				const {
					party: { storage },
					config: { storagePrefix },
				} = this;
				// @ts-ignore
				const hasExistingStore = await this.hasStoreInStorage(
					storage,
					storagePrefix,
				);
				if (hasExistingStore) {
					return new Response(null, {
						headers: TINYBASE_CORS_HEADERS,
						status: 205,
					});
				}

				const payload = jsonParseWithUndefined(bodyText);
				// @ts-ignore
				await this.saveStore(payload, true, request);
				return new Response(null, {
					headers: TINYBASE_CORS_HEADERS,
					status: 201,
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

		try {
			const response = await super.onRequest(request);
			const headers = new Headers(response.headers);
			for (const [name, value] of Object.entries(TINYBASE_CORS_HEADERS)) {
				headers.set(name, value);
			}
			headers.set('Content-Type', 'application/json');

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
