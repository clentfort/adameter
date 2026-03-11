import type PartySocket from 'partysocket';
import type { MergeableContent, MergeableStore } from 'tinybase';
import { createCustomPersister } from 'tinybase/persisters';
import {
	decryptMergeableContent,
	encryptMergeableContent,
	jsonStringWithUndefined,
} from './crypto';
import { logger } from './logger';

const PUT = 'PUT';
const STORE_PATH = '/mergeable-store';

function getStoreProtocol(host: string): 'http' | 'https' {
	return host.startsWith('localhost') || host.startsWith('127.0.0.1')
		? 'http'
		: 'https';
}

export function createSecurePartyKitPersister(
	store: MergeableStore,
	connection: PartySocket,
	encryptionKey: CryptoKey,
	onIgnoredError?: (error: unknown) => void,
) {
	let executionChain: Promise<unknown> = Promise.resolve();
	let hasSuccessfullyLoadedPersistedData = false;
	let hasSuccessfullySavedFullContent = false;
	const { host, room } = connection.partySocketOptions;
	const protocol = getStoreProtocol(host);
	const storeUrl = `${protocol}://${host}/parties/${connection.name}/${room}${STORE_PATH}`;

	const saveStore = async (content: MergeableContent) => {
		const start = performance.now();
		const body = jsonStringWithUndefined(
			await encryptMergeableContent(content, encryptionKey),
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
		const result = (await response.json()) as string | undefined;

		if (result) {
			const decrypted = await decryptMergeableContent(result, encryptionKey);
			logger.log(
				`[PERF] getOrSetStore (load) took ${(performance.now() - start).toFixed(2)}ms`,
			);
			return {
				persisted: decrypted,
			};
		}

		logger.log(
			`[PERF] getOrSetStore (load) took ${(performance.now() - start).toFixed(2)}ms`,
		);
		return {
			persisted: result,
		};
	};

	const getPersisted = async (): Promise<MergeableContent | undefined> => {
		executionChain = executionChain.catch(() => {}).then(loadStore);
		const persistedState = (await executionChain) as {
			persisted: MergeableContent | string | undefined;
		};
		hasSuccessfullyLoadedPersistedData = true;

		const persisted = persistedState.persisted;
		if (Array.isArray(persisted)) {
			// By returning a 3-element tuple [tables, values, 1], we tell TinyBase
			// that this is a MergeableChange set, which triggers a merge instead
			// of a setContent operation. This prevents local changes from being
			// overwritten by the remote load.
			return [
				...persisted,
				1,
			] as unknown as MergeableContent;
		}

		return undefined;
	};

	const setPersisted = async (
		getContent: () => MergeableContent,
	): Promise<void> => {
		executionChain = executionChain
			.catch(() => {})
			.then(async () => {
				if (!hasSuccessfullyLoadedPersistedData) {
					return;
				}

				await saveStore(getContent());
				hasSuccessfullySavedFullContent = true;
			});
		await executionChain;
	};

	const persister = createCustomPersister(
		store,
		getPersisted,
		setPersisted,
		() => {},
		() => {},
		onIgnoredError,
		2, // Persists.MergeableStoreOnly
	);

	return {
		...persister,
		hasLoadedPersistedData: () => hasSuccessfullyLoadedPersistedData,
		hasSavedFullContent: () => hasSuccessfullySavedFullContent,
	};
}
