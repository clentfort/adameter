import type { BrowserContext, Page } from '@playwright/test';
import type { PlainCell } from 'tinybase-synchronizer-partykit-client-encrypted';
import {
	decryptCells,
	getCellKeys,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { RELAY_ORIGIN } from './servers';

type RelayFailure = 'unreachable' | 'rate-limited';

export interface RelayCounts {
	/** `GET /cells` requests. */
	cellPulls: number;
	/** `POST /cells` requests. */
	cellUploads: number;
	/** Cells returned by `GET /cells`. */
	pulledCells: number;
	/** `GET /store` requests for legacy snapshots. */
	snapshotRequests: number;
	/** WebSocket messages received from the relay. */
	socketMessages: number;
}

export interface RelayControl {
	block: (failure?: RelayFailure) => void;
	/** Requests and messages that reached the (blocked or real) relay. */
	readonly counts: RelayCounts;
	/** All cells and snapshot requests, for "nothing happened" checks. */
	readonly syncRequests: number;
	unblock: () => void;
}

const CORS_HEADERS = {
	'Access-Control-Allow-Headers': 'Content-Type, If-Match, If-None-Match',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Expose-Headers': 'ETag',
};

/**
 * Counts relay traffic of one browser context and can simulate an outage for
 * it while the rest of the network keeps working, e.g. when Cloudflare is down
 * or blocks requests.
 */
export async function controlRelay(
	context: BrowserContext,
): Promise<RelayControl> {
	let failure: RelayFailure | undefined;
	const counts: RelayCounts = {
		cellPulls: 0,
		cellUploads: 0,
		pulledCells: 0,
		snapshotRequests: 0,
		socketMessages: 0,
	};

	await context.route(`${RELAY_ORIGIN}/**`, async (route) => {
		const request = route.request();
		const { pathname } = new URL(request.url());
		const isCells = pathname.endsWith('/cells');
		if (request.method() !== 'OPTIONS') {
			if (isCells && request.method() === 'GET') counts.cellPulls += 1;
			if (isCells && request.method() === 'POST') counts.cellUploads += 1;
			if (pathname.endsWith('/store')) counts.snapshotRequests += 1;
		}
		if (!failure) {
			if (isCells && request.method() === 'GET') {
				const response = await route.fetch();
				const body = (await response.json()) as { cells?: unknown[] };
				counts.pulledCells += body.cells?.length ?? 0;
				await route.fulfill({ json: body, response });
				return;
			}
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
		const server = ws.connectToServer();
		server.onMessage((message) => {
			counts.socketMessages += 1;
			ws.send(message);
		});
	});

	return {
		block: (nextFailure = 'unreachable') => {
			failure = nextFailure;
		},
		counts,
		get syncRequests() {
			return counts.cellPulls + counts.cellUploads + counts.snapshotRequests;
		},
		unblock: () => {
			failure = undefined;
		},
	};
}

/**
 * Waits for a successful upload whose decrypted cells match `matches`.
 */
export async function waitForCellUpload(
	page: Page,
	roomName: string,
	matches: (cells: PlainCell[]) => boolean,
	timeout = 30_000,
) {
	const keys = await getCellKeys(roomName);
	return page.waitForResponse(
		async (response) => {
			const request = response.request();
			if (
				!response.ok() ||
				request.method() !== 'POST' ||
				!response.url().endsWith('/cells')
			) {
				return false;
			}
			try {
				const cells = await decryptCells(
					keys,
					JSON.parse(request.postData() ?? '[]'),
				);
				return matches(cells);
			} catch {
				return false;
			}
		},
		{ timeout },
	);
}

/** Waits for any successful upload of cells. */
export function waitForAnyCellUpload(page: Page, timeout = 30_000) {
	return page.waitForResponse(
		(response) =>
			response.ok() &&
			response.request().method() === 'POST' &&
			response.url().endsWith('/cells'),
		{ timeout },
	);
}
