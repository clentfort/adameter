import type { Connection, ConnectionContext, WSMessage } from 'partyserver';
import type { StoredCell } from './cell-store';
import { Server } from 'partyserver';
import {
	CellStore,
	CellValidationError,
	MAX_BATCH_BYTES,
	MAX_PAGE_CELLS,
	parseCellBatch,
} from './cell-store';

const CELLS_PROTOCOL = 'cells';
const CELLS_TAG = 'cells';
const MESSAGE_SEPARATOR = '\n';
const SNAPSHOT_KEY = 'snapshot';
const SNAPSHOT_REVISION_KEY = 'snapshot_revision';

// Cloudflare Durable Object storage value limit.
const MAX_STORAGE_VALUE_BYTES = 131_072;
const SNAPSHOT_CHUNK_SIZE_BYTES = 120_000;

/**
 * Configuration for the encrypted synchronizer relay server.
 */
export interface EncryptedSyncRelayConfig {
	/**
	 * Custom response headers, e.g. for CORS.
	 * Defaults to permissive CORS headers.
	 */
	responseHeaders?: Record<string, string>;

	/**
	 * The HTTP endpoint path for storing/retrieving encrypted snapshots.
	 * Defaults to '/store'.
	 */
	storePath?: string;
}

/** Sent to `cells` connections for every accepted upload. */
export interface CellsBroadcast {
	cells: StoredCell[];
	fromSeq: number;
	toSeq: number;
	type: 'cells';
}

const DEFAULT_RESPONSE_HEADERS: Record<string, string> = {
	'Access-Control-Allow-Headers': 'Content-Type, If-Match, If-None-Match',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Expose-Headers': 'ETag',
	'Cache-Control': 'no-store',
};

/**
 * PartyServer Durable Object that acts as an opaque relay for the encrypted TinyBase
 * synchronizer protocol.
 *
 * - WebSocket messages are forwarded between clients without decryption.
 *   The server sees only opaque ciphertext and routes based on the plaintext
 *   client-ID prefix that precedes the encrypted payload.
 *
 * - An HTTP GET/PUT endpoint (default `/store`) stores an encrypted
 *   MergeableContent snapshot so new clients can bootstrap when no other
 *   peers are online.
 *
 * - `POST /cells` and `GET /cells?since=<seq>` store and list one encrypted
 *   value per cell, merged by HLC. Accepted cells are broadcast to WebSocket
 *   connections opened with `?protocol=cells`, which never receive relay
 *   messages of the snapshot protocol (and vice versa).
 *
 * The server never has access to encryption keys and cannot read any
 * application data — it is a pure relay.
 *
 * @example
 * ```ts
 * // party/main.ts
 * export class Tinybase extends EncryptedSyncRelayServer {}
 * ```
 *
 * @example
 * ```ts
 * // party/main.ts — with custom config
 * import { EncryptedSyncRelayServer } from 'tinybase-synchronizer-partykit-server-encrypted';
 *
 * export default class MyServer extends EncryptedSyncRelayServer {
 *   readonly config = { storePath: '/my-store' };
 * }
 * ```
 */
export class EncryptedSyncRelayServer<
	Env extends Cloudflare.Env = Cloudflare.Env,
> extends Server<Env> {
	static options = { hibernate: true };

	/**
	 * Optional configuration. Override in subclasses to customize.
	 */
	readonly config: EncryptedSyncRelayConfig = {};

	private snapshotWriteQueue: Promise<void> = Promise.resolve();

	private cellStore?: CellStore;

	private getCellStore(): CellStore {
		this.cellStore ??= new CellStore(this.ctx.storage.sql, (closure) =>
			this.ctx.storage.transactionSync(closure),
		);
		return this.cellStore;
	}

	private getByteLength(value: string): number {
		return new TextEncoder().encode(value).byteLength;
	}

	private async getChunkCount(baseKey: string): Promise<number> {
		const chunkCount = await this.ctx.storage.get<string>(
			`${baseKey}_chunk_count`,
		);
		if (!chunkCount) {
			return 0;
		}
		const parsed = Number.parseInt(chunkCount, 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
	}

	private async getSnapshotRevision(): Promise<number> {
		const revision = await this.ctx.storage.get<string>(SNAPSHOT_REVISION_KEY);
		const parsed = Number.parseInt(revision ?? '0', 10);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
	}

	private async clearChunkedSnapshot(baseKey: string): Promise<void> {
		const chunkCount = await this.getChunkCount(baseKey);
		for (let index = 0; index < chunkCount; index += 1) {
			await this.ctx.storage.delete(`${baseKey}_chunk_${index}`);
		}
		await this.ctx.storage.delete(`${baseKey}_chunk_count`);
	}

	private async readSnapshot(
		baseKey = SNAPSHOT_KEY,
	): Promise<string | undefined> {
		const chunkCount = await this.getChunkCount(baseKey);
		if (chunkCount > 0) {
			const chunks = await Promise.all(
				Array.from({ length: chunkCount }, async (_value, index) => {
					return this.ctx.storage.get<string>(`${baseKey}_chunk_${index}`);
				}),
			);
			if (chunks.some((chunk) => chunk == null)) {
				return undefined;
			}
			return chunks.join('');
		}
		return this.ctx.storage.get<string>(baseKey);
	}

	private async writeSnapshot(
		snapshot: string,
		baseKey = SNAPSHOT_KEY,
	): Promise<void> {
		if (this.getByteLength(snapshot) <= MAX_STORAGE_VALUE_BYTES) {
			await this.ctx.storage.put(baseKey, snapshot);
			await this.clearChunkedSnapshot(baseKey);
			return;
		}

		await this.clearChunkedSnapshot(baseKey);
		const chunks: string[] = [];
		for (
			let start = 0;
			start < snapshot.length;
			start += SNAPSHOT_CHUNK_SIZE_BYTES
		) {
			chunks.push(snapshot.slice(start, start + SNAPSHOT_CHUNK_SIZE_BYTES));
		}

		for (let index = 0; index < chunks.length; index += 1) {
			await this.ctx.storage.put(`${baseKey}_chunk_${index}`, chunks[index]);
		}
		await this.ctx.storage.put(`${baseKey}_chunk_count`, String(chunks.length));
		await this.ctx.storage.delete(baseKey);
	}

	private async writeVersionedSnapshot(
		snapshot: string,
		expectedRevision: string | null,
		headers: Record<string, string>,
	): Promise<Response> {
		let releaseQueue: (() => void) | undefined;
		const previousWrite = this.snapshotWriteQueue;
		this.snapshotWriteQueue = new Promise<void>((resolve) => {
			releaseQueue = resolve;
		});

		await previousWrite;
		try {
			const revision = await this.getSnapshotRevision();
			if (!expectedRevision) {
				return new Response('Snapshot version required', {
					headers,
					status: 428,
				});
			}
			// Cloudflare may weaken response ETags while compressing snapshots.
			// Treat W/"n" as the same opaque revision as "n".
			if (expectedRevision.replace(/^W\//, '') !== `"${revision}"`) {
				return new Response('Snapshot version conflict', {
					headers: { ...headers, ETag: `"${revision}"` },
					status: 412,
				});
			}

			await this.writeSnapshot(snapshot);
			const nextRevision = revision + 1;
			await this.ctx.storage.put(SNAPSHOT_REVISION_KEY, String(nextRevision));
			return new Response('ok', {
				headers: { ...headers, ETag: `"${nextRevision}"` },
				status: 200,
			});
		} finally {
			releaseQueue?.();
		}
	}

	async onRequest(request: Request): Promise<Response> {
		const headers = this.config.responseHeaders ?? DEFAULT_RESPONSE_HEADERS;

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers, status: 204 });
		}

		const storePath = this.config.storePath ?? '/store';
		const url = new URL(request.url);
		if (url.pathname.endsWith('/cells')) {
			return this.handleCellsRequest(request, url, headers);
		}
		if (!url.pathname.endsWith(storePath)) {
			return new Response('Not found', { status: 404 });
		}

		try {
			if (request.method === 'GET') {
				const revision = await this.getSnapshotRevision();
				const etag = `"${revision}"`;
				if (
					request.headers.get('If-None-Match')?.replace(/^W\//, '') === etag
				) {
					return new Response(null, {
						headers: { ...headers, ETag: etag },
						status: 304,
					});
				}
				const snapshot = await this.readSnapshot();
				return new Response(snapshot ?? 'null', {
					headers: {
						...headers,
						'Content-Type': 'text/plain',
						'ETag': etag,
					},
					status: 200,
				});
			}

			if (request.method === 'PUT') {
				const expectedRevision = request.headers.get('If-Match');
				// Workerd requires request streams to be consumed before a response is
				// returned, including precondition failures.
				const body = await request.text();
				return this.writeVersionedSnapshot(body, expectedRevision, headers);
			}

			return new Response('Method not allowed', { status: 405 });
		} catch (error) {
			return new Response(JSON.stringify({ error: String(error) }), {
				headers: { ...headers, 'Content-Type': 'application/json' },
				status: 500,
			});
		}
	}

	private async handleCellsRequest(
		request: Request,
		url: URL,
		headers: Record<string, string>,
	): Promise<Response> {
		const json = (body: unknown, status = 200) =>
			new Response(JSON.stringify(body), {
				headers: { ...headers, 'Content-Type': 'application/json' },
				status,
			});

		try {
			if (request.method === 'GET') {
				const since = Number(url.searchParams.get('since') ?? '0');
				const limit = Number(url.searchParams.get('limit') ?? MAX_PAGE_CELLS);
				if (
					!Number.isSafeInteger(since) ||
					since < 0 ||
					!Number.isSafeInteger(limit) ||
					limit < 1
				) {
					return json({ error: 'Invalid since or limit' }, 400);
				}
				const cellStore = this.getCellStore();
				return json({
					...cellStore.list(since, limit),
					epoch: cellStore.getEpoch(),
				});
			}

			if (request.method === 'POST') {
				const contentLength = Number(request.headers.get('Content-Length'));
				if (contentLength > MAX_BATCH_BYTES) {
					await request.body?.cancel();
					return json({ error: 'Batch too large' }, 413);
				}
				const body = await request.text();
				if (new TextEncoder().encode(body).byteLength > MAX_BATCH_BYTES) {
					return json({ error: 'Batch too large' }, 413);
				}

				let parsed: unknown;
				try {
					parsed = JSON.parse(body);
				} catch {
					return json({ error: 'Invalid JSON' }, 400);
				}
				const cells = parseCellBatch(parsed);
				const cellStore = this.getCellStore();
				const rejected = cellStore.getFutureCells(cells, Date.now());
				if (rejected.length > 0) {
					return json({ error: 'HLC too far in the future', rejected }, 422);
				}

				const epoch = cellStore.getEpoch();
				const { accepted, head } = cellStore.put(cells);
				if (accepted.length === 0) {
					return json({ epoch, head });
				}
				this.broadcastCells(accepted);
				// Lets the uploader skip its own broadcast.
				return json({
					epoch,
					fromSeq: accepted[0].seq,
					head,
					toSeq: accepted.at(-1)!.seq,
				});
			}

			return json({ error: 'Method not allowed' }, 405);
		} catch (error) {
			if (error instanceof CellValidationError) {
				return json({ error: error.message }, error.status);
			}
			return json({ error: 'Internal error' }, 500);
		}
	}

	private broadcastCells(cells: StoredCell[]) {
		const message: CellsBroadcast = {
			cells,
			fromSeq: cells[0].seq,
			toSeq: cells.at(-1)!.seq,
			type: 'cells',
		};
		const payload = JSON.stringify(message);
		for (const connection of this.getConnections(CELLS_TAG)) {
			try {
				connection.send(payload);
			} catch {
				// A broken connection must not keep the others from the update;
				// its client pulls the missed cells after reconnecting.
			}
		}
	}

	getConnectionTags(_connection: Connection, ctx: ConnectionContext): string[] {
		const protocol = new URL(ctx.request.url).searchParams.get('protocol');
		return protocol === CELLS_PROTOCOL ? [CELLS_TAG] : [];
	}

	onConnect(connection: Connection, _ctx: ConnectionContext): void {
		void connection;
	}

	onMessage(sender: Connection, message: WSMessage): void {
		if (typeof message !== 'string') return;
		// Clients of the cells protocol only receive broadcasts.
		if (sender.tags.includes(CELLS_TAG)) return;

		const splitAt = message.indexOf(MESSAGE_SEPARATOR);
		if (splitAt === -1) return;

		// The plaintext prefix before the separator is the target client ID.
		// Everything after (including the separator) is the encrypted payload.
		const toClientId = message.slice(0, splitAt);
		const encryptedRemainder = message.slice(splitAt); // includes the \n

		// Prepend the sender's connection ID so receivers know who sent it.
		const forwardedPayload = sender.id + encryptedRemainder;

		for (const conn of this.getConnections()) {
			if (conn.tags.includes(CELLS_TAG)) continue;
			if (toClientId === '') {
				// Broadcast to all except sender
				if (conn.id !== sender.id) conn.send(forwardedPayload);
			} else if (conn.id === toClientId) {
				// Direct message to a specific client
				conn.send(forwardedPayload);
				break;
			}
		}
	}
}
