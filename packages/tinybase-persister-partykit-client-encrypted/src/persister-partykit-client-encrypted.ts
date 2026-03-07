import type PartySocket from 'partysocket';
import type { Changes, Content, Store } from 'tinybase';
import { createCustomPersister } from 'tinybase/persisters';
import {
	decryptChanges,
	decryptContent,
	encryptChanges,
	encryptContent,
	hasLegacyRowEncryption,
	jsonParseWithUndefined,
	jsonStringWithUndefined,
} from './crypto';
import { logger } from './logger';

const MESSAGE = 'message';
const PUT = 'PUT';
const SET_CHANGES = 's';
const STORE_PATH = '/store';

function getStoreProtocol(host: string): 'http' | 'https' {
	return host.startsWith('localhost') || host.startsWith('127.0.0.1')
		? 'http'
		: 'https';
}

export function createSecurePartyKitPersister(
	store: Store,
	connection: PartySocket,
	encryptionKey: CryptoKey,
	onIgnoredError?: (error: unknown) => void,
) {
	let executionChain: Promise<unknown> = Promise.resolve();
	let hasSuccessfullyLoadedPersistedData = false;
	let hasSuccessfullySavedFullContent = false;
	let hasPendingLegacyRowEncryptionMigration = false;
	const { host, room } = connection.partySocketOptions;
	const protocol = getStoreProtocol(host);
	const storeUrl = `${protocol}://${host}/parties/${connection.name}/${room}${STORE_PATH}`;

	const saveStore = async (content: Content) => {
		const start = performance.now();
		const body = jsonStringWithUndefined(
			await encryptContent(content, encryptionKey),
		);

		const response = await fetch(storeUrl, {
			body,
			cache: 'no-store',
			method: PUT,
			mode: 'cors',
		});
		const result = await response.json();

		logger.log(
			`[PERF] getOrSetStore (save) took ${(performance.now() - start).toFixed(2)}ms`,
		);
		return result;
	};

	const loadStore = async () => {
		const start = performance.now();
		const response = await fetch(storeUrl, {
			cache: 'no-store',
			mode: 'cors',
		});
		const result = (await response.json()) as Content | undefined;

		if (result) {
			const hasLegacyRowEncryptionFormat = hasLegacyRowEncryption(result);
			const decrypted = await decryptContent(result, encryptionKey);
			logger.log(
				`[PERF] getOrSetStore (load) took ${(performance.now() - start).toFixed(2)}ms`,
			);
			return {
				hasLegacyRowEncryptionFormat,
				persisted: decrypted,
			};
		}

		logger.log(
			`[PERF] getOrSetStore (load) took ${(performance.now() - start).toFixed(2)}ms`,
		);
		return {
			hasLegacyRowEncryptionFormat: false,
			persisted: result,
		};
	};

	const queueLegacyRowEncryptionMigration = (content: Content) => {
		if (hasPendingLegacyRowEncryptionMigration) {
			return;
		}

		hasPendingLegacyRowEncryptionMigration = true;
		executionChain = executionChain
			.catch(() => {})
			.then(async () => {
				const start = performance.now();
				await saveStore(content);
				hasSuccessfullySavedFullContent = true;
				logger.log(
					`[PERF] Legacy row encryption migration took ${(performance.now() - start).toFixed(2)}ms`,
				);
			})
			.catch((error) => {
				onIgnoredError?.(error);
			})
			.finally(() => {
				hasPendingLegacyRowEncryptionMigration = false;
			});
	};

	const getPersisted = async (): Promise<Content | undefined> => {
		executionChain = executionChain.catch(() => {}).then(loadStore);
		const persistedState = (await executionChain) as Awaited<
			ReturnType<typeof loadStore>
		>;
		hasSuccessfullyLoadedPersistedData = true;

		if (
			persistedState.hasLegacyRowEncryptionFormat &&
			persistedState.persisted
		) {
			queueLegacyRowEncryptionMigration(persistedState.persisted);
		}

		return persistedState.persisted;
	};

	const setPersisted = async (
		getContent: () => Content,
		changes?: Changes,
	): Promise<void> => {
		executionChain = executionChain
			.catch(() => {})
			.then(async () => {
				if (changes) {
					const encryptedChanges = await encryptChanges(
						changes,
						encryptionKey,
						(tableId, rowId) => store.getRow(tableId, rowId),
					);
					connection.send(
						SET_CHANGES + jsonStringWithUndefined(encryptedChanges),
					);
					return;
				}

				if (!hasSuccessfullyLoadedPersistedData) {
					return;
				}

				await saveStore(getContent());
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
