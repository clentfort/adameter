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
import { logger } from './logger';

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
	let executionChain = Promise.resolve();
	let hasSuccessfullyLoadedPersistedData = false;
	let hasSuccessfullySavedFullContent = false;
	const { host, room } = connection.partySocketOptions;
	const protocol = getStoreProtocol(host);
	const storeUrl = `${protocol}://${host}/parties/${connection.name}/${room}${STORE_PATH}`;

	const getOrSetStore = async (content?: Content) => {
		const start = performance.now();
		let encryptTime = 0;
		let body: string | undefined;
		if (content) {
			const startEncrypt = performance.now();
			body = jsonStringWithUndefined(
				await encryptContent(content, encryptionKey),
			);
			encryptTime = performance.now() - startEncrypt;
		}

		const startFetch = performance.now();
		const response = await fetch(storeUrl, {
			...(body ? { body, method: PUT } : {}),
			cache: 'no-store',
			mode: 'cors',
		});
		const fetchTime = performance.now() - startFetch;

		const startParse = performance.now();
		const result = await response.json();
		const parseTime = performance.now() - startParse;

		if (result && !content) {
			const startDecrypt = performance.now();
			const decrypted = await decryptContent(result, encryptionKey);
			const decryptTime = performance.now() - startDecrypt;
			logger.log(
				`[PERF] getOrSetStore (load) took ${(performance.now() - start).toFixed(2)}ms (fetch: ${fetchTime.toFixed(2)}ms, parse: ${parseTime.toFixed(2)}ms, decrypt: ${decryptTime.toFixed(2)}ms)`,
			);
			return decrypted;
		}

		logger.log(
			`[PERF] getOrSetStore (${content ? 'save' : 'load'}) took ${(performance.now() - start).toFixed(2)}ms (encrypt: ${encryptTime.toFixed(2)}ms, fetch: ${fetchTime.toFixed(2)}ms, parse: ${parseTime.toFixed(2)}ms)`,
		);
		return result;
	};

	const getPersisted = async (): Promise<Content | undefined> => {
		executionChain = executionChain
			.catch(() => {})
			.then(() => getOrSetStore() as Promise<Content | undefined>);
		const persisted = await executionChain;
		hasSuccessfullyLoadedPersistedData = true;
		return persisted;
	};

	const setPersisted = async (
		getContent: () => Content,
		changes?: Changes,
	): Promise<void> => {
		executionChain = executionChain.catch(() => {}).then(async () => {
			if (changes) {
				const encryptedChanges = await encryptChanges(
					changes,
					encryptionKey,
					(tableId, rowId) => store.getRow(tableId, rowId),
				);
				connection.send(SET_CHANGES + jsonStringWithUndefined(encryptedChanges));
				return;
			}

			if (!hasSuccessfullyLoadedPersistedData) {
				return;
			}

			await getOrSetStore(getContent());
			hasSuccessfullySavedFullContent = true;
		});
		await executionChain;
	};

	const addPersisterListener = (
		listener: (
			content: Content | undefined,
			changes: Changes | undefined,
		) => void,
	) => {
		const messageListener = async (event: MessageEvent) => {
			const data = event.data;

			if (typeof data === 'string' && data.startsWith(SET_CHANGES)) {
				executionChain = executionChain
					.catch(() => {})
					.then(async () => {
						const start = performance.now();
						try {
							const encryptedChanges = jsonParseWithUndefined<Changes>(
								data.slice(1),
							);
							const decryptedChanges = await decryptChanges(
								encryptedChanges,
								encryptionKey,
							);
							listener(undefined, decryptedChanges);
							logger.log(
								`[PERF] Incoming message processing took ${(performance.now() - start).toFixed(2)}ms`,
							);
						} catch (error) {
							onIgnoredError?.(error);
						}
					});

				await executionChain;
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

	const persister = createCustomPersister(
		store,
		getPersisted,
		setPersisted,
		addPersisterListener,
		delPersisterListener,
		onIgnoredError,
	);

	return {
		...persister,
		hasLoadedPersistedData: () => hasSuccessfullyLoadedPersistedData,
		hasSavedFullContent: () => hasSuccessfullySavedFullContent,
	};
}
