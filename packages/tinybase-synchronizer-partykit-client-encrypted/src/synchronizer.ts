import type PartySocket from 'partysocket';
import type {
	MergeableChanges,
	MergeableContent,
	MergeableStore,
} from 'tinybase';
import type { Synchronizer } from 'tinybase/synchronizers';
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

const MESSAGE_SEPARATOR = '\n';
const REQUEST_TIMEOUT_SECONDS = 5;

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

	// Wait for the WebSocket connection to be open before returning
	return new Promise<Synchronizer>((resolve) => {
		if (connection.readyState === WebSocket.OPEN) {
			resolve(synchronizer);
			return;
		}
		const onAttempt = () => {
			connection.removeEventListener('open', onAttempt);
			connection.removeEventListener('error', onAttempt);
			resolve(synchronizer);
		};
		connection.addEventListener('open', onAttempt);
		connection.addEventListener('error', onAttempt);
	});
}

/**
 * Loads an encrypted MergeableContent snapshot from the server and merges
 * it into the store. Used for bootstrap when no other clients are online.
 *
 * Returns true if a snapshot was loaded and applied.
 */
export async function loadServerSnapshot(
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
	if (!encrypted || encrypted === 'null') return false;

	const decrypted = await decrypt(encrypted, encryptionKey);
	const mergeableContent = jsonParseWithUndefined(decrypted);
	if (!mergeableContent) return false;

	store.applyMergeableChanges(
		mergeableContent as MergeableChanges | MergeableContent,
	);
	return true;
}

/**
 * Encrypts the store's MergeableContent and saves it to the server.
 * Used to persist state for clients that connect when no peers are online.
 */
export async function saveServerSnapshot(
	store: MergeableStore,
	storeUrl: string,
	encryptionKey: CryptoKey,
): Promise<void> {
	const content = store.getMergeableContent();
	const serialized = jsonStringWithUndefined(content);
	const encrypted = await encrypt(serialized, encryptionKey);

	const response = await fetch(storeUrl, {
		body: encrypted,
		cache: 'no-store',
		method: 'PUT',
		mode: 'cors',
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`Snapshot PUT failed (${response.status}): ${errorBody || response.statusText}`,
		);
	}
}

/**
 * Builds the HTTP URL for the store snapshot endpoint.
 */
export function getStoreUrl(connection: PartySocket): string {
	const { host, room } = connection.partySocketOptions;
	const protocol = getStoreProtocol(host);
	return `${protocol}://${host}/parties/${connection.name}/${room}/store`;
}
