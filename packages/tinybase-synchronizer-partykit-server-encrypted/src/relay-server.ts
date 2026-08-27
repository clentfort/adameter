import type { Connection, ConnectionContext, WSMessage } from 'partyserver';
import { Server } from 'partyserver';

const MESSAGE_SEPARATOR = '\n';
const SNAPSHOT_KEY = 'snapshot';
const SNAPSHOT_REVISION_KEY = 'snapshot_revision';
const SNAPSHOT_CHUNK_COUNT_KEY = 'snapshot_chunk_count';
const SNAPSHOT_CHUNK_KEY_PREFIX = 'snapshot_chunk_';

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

const DEFAULT_RESPONSE_HEADERS: Record<string, string> = {
	'Access-Control-Allow-Headers': 'If-Match',
	'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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
export class EncryptedSyncRelayServer extends Server {
	static options = { hibernate: true };

	/**
	 * Optional configuration. Override in subclasses to customize.
	 */
	readonly config: EncryptedSyncRelayConfig = {};

	private snapshotWriteQueue: Promise<void> = Promise.resolve();

	private getSnapshotChunkKey(index: number): string {
		return `${SNAPSHOT_CHUNK_KEY_PREFIX}${index}`;
	}

	private getByteLength(value: string): number {
		return new TextEncoder().encode(value).byteLength;
	}

	private async getChunkCount(): Promise<number> {
		const chunkCount = await this.ctx.storage.get<string>(
			SNAPSHOT_CHUNK_COUNT_KEY,
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

	private async clearChunkedSnapshot(): Promise<void> {
		const chunkCount = await this.getChunkCount();
		if (chunkCount > 0) {
			for (let index = 0; index < chunkCount; index += 1) {
				await this.ctx.storage.delete(this.getSnapshotChunkKey(index));
			}
		}
		await this.ctx.storage.delete(SNAPSHOT_CHUNK_COUNT_KEY);
	}

	private async readSnapshot(): Promise<string | undefined> {
		const chunkCount = await this.getChunkCount();
		if (chunkCount > 0) {
			const chunks = await Promise.all(
				Array.from({ length: chunkCount }, async (_value, index) => {
					return this.ctx.storage.get<string>(this.getSnapshotChunkKey(index));
				}),
			);
			if (chunks.some((chunk) => chunk == null)) {
				return undefined;
			}
			return chunks.join('');
		}
		return this.ctx.storage.get<string>(SNAPSHOT_KEY);
	}

	private async writeSnapshot(snapshot: string): Promise<void> {
		if (this.getByteLength(snapshot) <= MAX_STORAGE_VALUE_BYTES) {
			await this.ctx.storage.put(SNAPSHOT_KEY, snapshot);
			await this.clearChunkedSnapshot();
			return;
		}

		await this.clearChunkedSnapshot();
		const chunks: string[] = [];
		for (
			let start = 0;
			start < snapshot.length;
			start += SNAPSHOT_CHUNK_SIZE_BYTES
		) {
			chunks.push(snapshot.slice(start, start + SNAPSHOT_CHUNK_SIZE_BYTES));
		}

		for (let index = 0; index < chunks.length; index += 1) {
			await this.ctx.storage.put(
				this.getSnapshotChunkKey(index),
				chunks[index],
			);
		}
		await this.ctx.storage.put(SNAPSHOT_CHUNK_COUNT_KEY, String(chunks.length));
		await this.ctx.storage.delete(SNAPSHOT_KEY);
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
		if (!url.pathname.endsWith(storePath)) {
			return new Response('Not found', { status: 404 });
		}

		try {
			if (request.method === 'GET') {
				const [snapshot, revision] = await Promise.all([
					this.readSnapshot(),
					this.getSnapshotRevision(),
				]);
				return new Response(snapshot ?? 'null', {
					headers: {
						...headers,
						'Content-Type': 'text/plain',
						'ETag': `"${revision}"`,
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

	onConnect(connection: Connection, _ctx: ConnectionContext): void {
		void connection;
	}

	onMessage(sender: Connection, message: WSMessage): void {
		if (typeof message !== 'string') return;

		const splitAt = message.indexOf(MESSAGE_SEPARATOR);
		if (splitAt === -1) return;

		// The plaintext prefix before the separator is the target client ID.
		// Everything after (including the separator) is the encrypted payload.
		const toClientId = message.slice(0, splitAt);
		const encryptedRemainder = message.slice(splitAt); // includes the \n

		// Prepend the sender's connection ID so receivers know who sent it.
		const forwardedPayload = sender.id + encryptedRemainder;

		if (toClientId === '') {
			// Broadcast to all except sender
			this.broadcast(forwardedPayload, [sender.id]);
		} else {
			// Direct message to a specific client
			for (const conn of this.getConnections()) {
				if (conn.id === toClientId) {
					conn.send(forwardedPayload);
					break;
				}
			}
		}
	}
}
