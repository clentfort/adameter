import type PartySocket from 'partysocket';
import type { Changes, Content, Store } from 'tinybase';
import { createCustomPersister } from 'tinybase/persisters';
import {
	decryptChanges,
	decryptContent,
	encryptChanges,
	encryptContent,
} from '@/utils/crypto';

const SET_CHANGES = 's';
const STORE_PATH = '/store';
const PUT = 'PUT';
const MESSAGE = 'message';

const jsonString = JSON.stringify;
const jsonParse = JSON.parse;

export function createSecurePartyKitPersister(
	store: Store,
	connection: PartySocket,
	encryptionKey: CryptoKey,
	onIgnoredError?: (error: unknown) => void,
) {
	const { host, room } = connection.partySocketOptions;
	const storePath = STORE_PATH;
	const storeProtocol = 'https';

	const storeUrl = `${storeProtocol}://${host}/parties/${connection.name}/${room}${storePath}`;

	const getOrSetStore = async (content?: Content) => {
		const body = content
			? jsonString(await encryptContent(content, encryptionKey))
			: undefined;

		const response = await fetch(storeUrl, {
			...(body ? { body, method: PUT } : {}),
			cache: 'no-store',
			mode: 'cors',
		});

		const result = await response.json();
		if (result && !content) {
			return await decryptContent(result, encryptionKey);
		}
		return result;
	};

	const getPersisted = async () => await getOrSetStore();

	const setPersisted = async (
		_getContent: () => Content,
		changes?: Changes,
	) => {
		if (changes) {
			const encryptedChanges = await encryptChanges(changes, encryptionKey);
			connection.send(SET_CHANGES + jsonString(encryptedChanges));
		} else {
			await getOrSetStore(_getContent());
		}
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
				try {
					const encryptedChanges = jsonParse(data.slice(1));
					const decrypted = await decryptChanges(
						encryptedChanges,
						encryptionKey,
					);
					listener(undefined, decrypted);
				} catch (error) {
					onIgnoredError?.(error);
				}
			}
		};
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		connection.addEventListener(MESSAGE, messageListener as any);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return messageListener as any;
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
