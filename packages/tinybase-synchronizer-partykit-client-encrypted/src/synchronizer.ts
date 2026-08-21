import type PartySocket from 'partysocket';
import type {
	Content,
	MergeableChanges,
	MergeableContent,
	MergeableStore,
} from 'tinybase';
import type { Synchronizer } from 'tinybase/synchronizers';
import { decryptContent } from 'tinybase-persister-partykit-client-encrypted';
import { createCustomSynchronizer } from 'tinybase/synchronizers';
import {
	decrypt,
	encrypt,
	jsonParseWithUndefined,
	jsonStringWithUndefined,
} from './crypto';

type IdOrNull = string | null;
type Message = number;
type Receive = (
	fromClientId: string,
	requestId: IdOrNull,
	message: Message,
	body: unknown,
) => void;
type Send = (
	toClientId: IdOrNull,
	requestId: IdOrNull,
	message: Message,
	body: unknown,
) => void;

const MAX_SNAPSHOT_SAVE_ATTEMPTS = 6;
const MESSAGE_SEPARATOR = '\n';
const REQUEST_TIMEOUT_SECONDS = 1;
const SNAPSHOT_RETRY_BASE_DELAY_MS = 100;

interface SnapshotSaveArguments {
	encryptionKey: CryptoKey;
	store: MergeableStore;
	storeUrl: string;
}

interface SnapshotSaveQueue {
	latest?: SnapshotSaveArguments;
	running: Promise<void>;
}

const snapshotOperationQueues = new Map<string, Promise<void>>();
const snapshotSaveQueues = new Map<string, SnapshotSaveQueue>();
const snapshotVersions = new Map<string, string>();

function runSnapshotOperation<Result>(
	storeUrl: string,
	operation: () => Promise<Result>,
): Promise<Result> {
	const previousOperation =
		snapshotOperationQueues.get(storeUrl) ?? Promise.resolve();
	const result = previousOperation.catch(() => {}).then(operation);
	const completion = result.then(
		() => undefined,
		() => undefined,
	);
	snapshotOperationQueues.set(storeUrl, completion);

	return result.finally(() => {
		if (snapshotOperationQueues.get(storeUrl) === completion) {
			snapshotOperationQueues.delete(storeUrl);
		}
	});
}

function waitForSnapshotRetry(attempt: number): Promise<void> {
	const exponentialDelay = SNAPSHOT_RETRY_BASE_DELAY_MS * 2 ** attempt;
	const jitter = Math.random() * SNAPSHOT_RETRY_BASE_DELAY_MS;
	return new Promise((resolve) => {
		setTimeout(resolve, exponentialDelay + jitter);
	});
}

function updateSnapshotVersion(storeUrl: string, response: Response) {
	const version = response.headers?.get('ETag');
	if (version) {
		// Cloudflare can weaken ETags when compressing responses. The revision is
		// still exact application metadata, so send its strong form in If-Match.
		snapshotVersions.set(storeUrl, version.replace(/^W\//, ''));
	} else {
		snapshotVersions.delete(storeUrl);
	}
}

function mergeLegacyContent(store: MergeableStore, content: Content) {
	const [tables, values] = content;
	store.transaction(() => {
		for (const [tableId, table] of Object.entries(tables)) {
			for (const [rowId, row] of Object.entries(table)) {
				if (!store.hasRow(tableId, rowId)) {
					store.setRow(tableId, rowId, row);
				}
			}
		}
		for (const [valueId, value] of Object.entries(values)) {
			if (!store.hasValue(valueId)) {
				store.setValue(valueId, value);
			}
		}
	});
}

function getStoreProtocol(host: string): 'http' | 'https' {
	return host.startsWith('localhost') || host.startsWith('127.0.0.1')
		? 'http'
		: 'https';
}

/**
 * Creates an encrypted PartyKit synchronizer for a MergeableStore.
 *
 * Messages are encrypted end-to-end: the server only sees opaque ciphertext
 * and relays messages between clients without being able to read them.
 *
 * The synchronizer also handles bootstrap (loading an encrypted snapshot from
 * the server via HTTP) and periodically saves snapshots for when no other
 * clients are online.
 */
export async function createEncryptedPartyKitSynchronizer(
	store: MergeableStore,
	connection: PartySocket,
	encryptionKey: CryptoKey,
	onIgnoredError?: (error: unknown) => void,
): Promise<Synchronizer> {
	const { host, room } = connection.partySocketOptions;
	const protocol = getStoreProtocol(host);
	const storeUrl = `${protocol}://${host}/parties/${connection.name}/${room}/store`;

	// --- Encrypted send/receive over WebSocket ---

	const send: Send = (toClientId, requestId, message, body) => {
		const payload = jsonStringWithUndefined([requestId, message, body]);
		void encrypt(payload, encryptionKey)
			.then((encrypted) => {
				const wire = (toClientId ?? '') + MESSAGE_SEPARATOR + encrypted;
				connection.send(wire);
			})
			.catch((error) => onIgnoredError?.(error));
	};

	const registerReceive = (receive: Receive) => {
		const listener = async (event: MessageEvent) => {
			try {
				const data =
					typeof event.data === 'string'
						? event.data
						: event.data.toString('utf8');
				const splitAt = data.indexOf(MESSAGE_SEPARATOR);
				if (splitAt === -1) return;

				const fromClientId = data.slice(0, splitAt);
				const encrypted = data.slice(splitAt + 1);
				const decrypted = await decrypt(encrypted, encryptionKey);
				const [requestId, message, body] =
					jsonParseWithUndefined<[IdOrNull, Message, unknown]>(decrypted);
				receive(fromClientId, requestId, message, body);
			} catch (error) {
				onIgnoredError?.(error);
			}
		};
		connection.addEventListener(
			'message',
			listener as unknown as EventListener,
		);
		return listener;
	};

	const destroy = () => {
		connection.close();
	};

	const synchronizer = createCustomSynchronizer(
		store,
		send,
		registerReceive,
		destroy,
		REQUEST_TIMEOUT_SECONDS,
		undefined,
		undefined,
		onIgnoredError,
	) as Synchronizer;

	// Wait for the WebSocket to open, while also polling readyState to avoid
	// missing an `open` event that fires between the initial check and listener
	// registration (a race seen on very fast local and mobile connections).
	return new Promise<Synchronizer>((resolve) => {
		const timers: {
			fallback?: ReturnType<typeof setTimeout>;
			poll?: ReturnType<typeof setInterval>;
		} = {};
		const finish = () => {
			if (timers.poll) clearInterval(timers.poll);
			if (timers.fallback) clearTimeout(timers.fallback);
			connection.removeEventListener('open', finish);
			connection.removeEventListener('error', finish);
			resolve(synchronizer);
		};

		if (connection.readyState === 1) {
			resolve(synchronizer);
			return;
		}

		connection.addEventListener('open', finish);
		connection.addEventListener('error', finish);
		timers.poll = setInterval(() => {
			if (connection.readyState === 1) finish();
		}, 25);
		timers.fallback = setTimeout(finish, 5000);
	});
}

/**
 * Loads an encrypted MergeableContent snapshot from the server and merges
 * it into the store. Used for bootstrap when no other clients are online.
 *
 * Returns true if a snapshot was loaded and applied.
 */
async function performSnapshotLoad(
	store: MergeableStore,
	storeUrl: string,
	encryptionKey: CryptoKey,
): Promise<boolean> {
	const response = await fetch(storeUrl, {
		cache: 'no-store',
		mode: 'cors',
	});
	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`Snapshot GET failed (${response.status}): ${errorBody || response.statusText}`,
		);
	}

	const encrypted = await response.text();
	if (!encrypted || encrypted === 'null') {
		updateSnapshotVersion(storeUrl, response);
		return false;
	}

	if (encrypted.startsWith('[')) {
		const legacyContent = jsonParseWithUndefined<Content>(encrypted);
		const decryptedContent = await decryptContent(legacyContent, encryptionKey);
		mergeLegacyContent(store, decryptedContent);
		updateSnapshotVersion(storeUrl, response);
		return true;
	}

	const decrypted = await decrypt(encrypted, encryptionKey);
	const mergeableContent = jsonParseWithUndefined(decrypted);
	if (!mergeableContent) return false;

	store.applyMergeableChanges(
		mergeableContent as MergeableChanges | MergeableContent,
	);
	// Publish the loaded revision only after its content has been applied. A
	// concurrent save must not use a fresh ETag with stale local data.
	updateSnapshotVersion(storeUrl, response);
	return true;
}

export function loadServerSnapshot(
	store: MergeableStore,
	storeUrl: string,
	encryptionKey: CryptoKey,
): Promise<boolean> {
	return runSnapshotOperation(storeUrl, () =>
		performSnapshotLoad(store, storeUrl, encryptionKey),
	);
}

/**
 * Encrypts the store's MergeableContent and saves it to the server.
 * Used to persist state for clients that connect when no peers are online.
 */
async function performSnapshotSave({
	encryptionKey,
	store,
	storeUrl,
}: SnapshotSaveArguments): Promise<void> {
	for (let attempt = 0; attempt < MAX_SNAPSHOT_SAVE_ATTEMPTS; attempt += 1) {
		const content = store.getMergeableContent();
		const serialized = jsonStringWithUndefined(content);
		const encrypted = await encrypt(serialized, encryptionKey);
		const version = snapshotVersions.get(storeUrl);

		const response = await fetch(storeUrl, {
			body: encrypted,
			cache: 'no-store',
			headers: version ? { 'If-Match': version } : undefined,
			method: 'PUT',
			mode: 'cors',
		});

		if (response.status === 412 && attempt < MAX_SNAPSHOT_SAVE_ATTEMPTS - 1) {
			// Multiple devices can race through the same GET/PUT cycle. Back off
			// with jitter before reloading so they do not remain in lockstep.
			await waitForSnapshotRetry(attempt);
			await performSnapshotLoad(store, storeUrl, encryptionKey);
			continue;
		}

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(
				`Snapshot PUT failed (${response.status}): ${errorBody || response.statusText}`,
			);
		}

		updateSnapshotVersion(storeUrl, response);
		return;
	}
}

export function saveServerSnapshot(
	store: MergeableStore,
	storeUrl: string,
	encryptionKey: CryptoKey,
): Promise<void> {
	const snapshotSaveArguments = { encryptionKey, store, storeUrl };
	const existingQueue = snapshotSaveQueues.get(storeUrl);
	if (existingQueue) {
		// Replace any pending save with one that will capture the latest store
		// state. Every caller awaits the same queue-draining promise.
		existingQueue.latest = snapshotSaveArguments;
		return existingQueue.running;
	}

	const queue: SnapshotSaveQueue = {
		latest: snapshotSaveArguments,
		running: Promise.resolve(),
	};
	queue.running = (async () => {
		while (queue.latest) {
			const latest = queue.latest;
			queue.latest = undefined;
			await runSnapshotOperation(storeUrl, () => performSnapshotSave(latest));
		}
	})().finally(() => {
		if (snapshotSaveQueues.get(storeUrl) === queue) {
			snapshotSaveQueues.delete(storeUrl);
		}
	});
	snapshotSaveQueues.set(storeUrl, queue);

	return queue.running;
}

/**
 * Builds the HTTP URL for the store snapshot endpoint.
 */
export function getStoreUrl(connection: PartySocket): string {
	const { host, room } = connection.partySocketOptions;
	const protocol = getStoreProtocol(host);
	return `${protocol}://${host}/parties/${connection.name}/${room}/store`;
}
