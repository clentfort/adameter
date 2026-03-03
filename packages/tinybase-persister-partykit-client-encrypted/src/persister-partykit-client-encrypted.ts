import type PartySocket from 'partysocket';
import type { Changes, Content, Store } from 'tinybase';
import { createCustomPersister } from 'tinybase/persisters';
import {
	decryptChanges,
	decryptContent,
	encryptChanges,
	encryptContent,
	jsonParseWithUndefined,
	jsonStringWithUndefined,
} from './crypto';

const MESSAGE = 'message';
const PUT = 'PUT';
const SET_CHANGES = 's';
const STORE_PATH = '/store';

function getStoreProtocol(host: string): 'http' | 'https' {
	if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
		return 'http';
	}

	return 'https';
}

export function createSecurePartyKitPersister(
	store: Store,
	connection: PartySocket,
	encryptionKey: CryptoKey,
	onIgnoredError?: (error: unknown) => void,
) {
	let lastSaveLoadPromise = Promise.resolve();
	const { host, room } = connection.partySocketOptions;
	const protocol = getStoreProtocol(host);
	const storeUrl = `${protocol}://${host}/parties/${connection.name}/${room}${STORE_PATH}`;

	const getOrSetStore = async (content?: Content) => {
		const body = content
			? jsonStringWithUndefined(await encryptContent(content, encryptionKey))
			: undefined;

		const response = await fetch(storeUrl, {
			...(body ? { body, method: PUT } : {}),
			cache: 'no-store',
			mode: 'cors',
		});
		const result = await response.json();

		if (result && !content) {
			return decryptContent(result, encryptionKey);
		}

		return result;
	};

	const getPersisted = async () => {
		const promise = lastSaveLoadPromise
			.catch(() => {})
			.then(() => getOrSetStore());
		lastSaveLoadPromise = promise;
		return promise;
	};

	const setPersisted = async (getContent: () => Content, changes?: Changes) => {
		const promise = lastSaveLoadPromise.catch(() => {}).then(async () => {
			if (changes) {
				const encryptedChanges = await encryptChanges(changes, encryptionKey);
				connection.send(
					SET_CHANGES + jsonStringWithUndefined(encryptedChanges),
				);
				return;
			}

			await getOrSetStore(getContent());
		});
		lastSaveLoadPromise = promise;
		return promise;
	};

	const addPersisterListener = (
		listener: (
			content: Content | undefined,
			changes: Changes | undefined,
		) => void,
	) => {
		let lastMessagePromise = Promise.resolve();
		const messageListener = (event: MessageEvent) => {
			const data = event.data;

			if (typeof data === 'string' && data.startsWith(SET_CHANGES)) {
				lastMessagePromise = lastMessagePromise
					.catch(() => {})
					.then(async () => {
						try {
							const encryptedChanges = jsonParseWithUndefined<Changes>(
								data.slice(1),
							);
							const decryptedChanges = await decryptChanges(
								encryptedChanges,
								encryptionKey,
							);
							listener(undefined, decryptedChanges);
						} catch (error) {
							onIgnoredError?.(error);
						}
					});
			}
		};

		connection.addEventListener(
			MESSAGE,
			messageListener as unknown as EventListener,
		);

		return messageListener as unknown as EventListener;
	};

	const delPersisterListener = (messageListener: unknown) => {
		connection.removeEventListener(MESSAGE, messageListener as EventListener);
	};

	return createCustomPersister(
		store,
		getPersisted,
		setPersisted,
		addPersisterListener,
		delPersisterListener,
		onIgnoredError,
	);
}
