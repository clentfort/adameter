import type { BrowserContext } from '@playwright/test';
import { RELAY_ORIGIN } from './servers';

type RelayFailure = 'unreachable' | 'rate-limited';

export interface RelayControl {
	block: (failure?: RelayFailure) => void;
	/** Snapshot requests that reached the (blocked or real) relay. */
	readonly snapshotRequests: number;
	unblock: () => void;
}

const CORS_HEADERS = {
	'Access-Control-Allow-Headers': 'If-Match',
	'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Expose-Headers': 'ETag',
};

/**
 * Simulates a relay outage for one browser context while the rest of the
 * network keeps working, e.g. when Cloudflare is down or blocks requests.
 */
export async function controlRelay(
	context: BrowserContext,
): Promise<RelayControl> {
	let failure: RelayFailure | undefined;
	let snapshotRequests = 0;

	await context.route(`${RELAY_ORIGIN}/**`, async (route) => {
		const request = route.request();
		if (request.url().endsWith('/store') && request.method() !== 'OPTIONS') {
			snapshotRequests += 1;
		}
		if (!failure) {
			await route.continue();
			return;
		}
		if (failure === 'unreachable') {
			await route.abort('connectionrefused');
			return;
		}
		await route.fulfill({
			body: 'Exceeded allowed requests',
			headers: CORS_HEADERS,
			status: request.method() === 'OPTIONS' ? 204 : 429,
		});
	});

	await context.routeWebSocket(new RegExp(`^ws://localhost:1999/`), (ws) => {
		if (failure) {
			ws.close({ code: 1011, reason: 'Relay unavailable' });
			return;
		}
		ws.connectToServer();
	});

	return {
		block: (nextFailure = 'unreachable') => {
			failure = nextFailure;
		},
		get snapshotRequests() {
			return snapshotRequests;
		},
		unblock: () => {
			failure = undefined;
		},
	};
}
