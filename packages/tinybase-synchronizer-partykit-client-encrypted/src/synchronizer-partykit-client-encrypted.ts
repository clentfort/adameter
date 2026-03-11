import { getUniqueId, type MergeableStore } from 'tinybase';
import { createCustomSynchronizer } from 'tinybase/synchronizers';
import type { Message, Send, Synchronizer } from 'tinybase/synchronizers';
import type PartySocket from 'partysocket';
import {
	decryptValue,
	encryptValue,
	jsonParseWithUndefined,
	jsonStringWithUndefined,
} from './crypto';
import { logger } from './logger';

const SYNC_MESSAGE = 'y';

export function createSecurePartyKitSynchronizer(
	store: MergeableStore,
	connection: PartySocket,
	encryptionKey: CryptoKey,
	onIgnoredError?: (error: unknown) => void,
	requestTimeoutSeconds = 1,
): Synchronizer {
	const myClientId = getUniqueId();
	let messageListener: ((event: MessageEvent) => void) | undefined;

	const send: Send = async (toClientId, requestId, message, body) => {
		try {
			const payload = [myClientId, toClientId, requestId, message, body];
			const encryptedPayload = await encryptValue(
				jsonStringWithUndefined(payload),
				encryptionKey,
			);
			connection.send(SYNC_MESSAGE + encryptedPayload);
		} catch (error) {
			onIgnoredError?.(error);
		}
	};

	return createCustomSynchronizer(
		store,
		send,
		(receive) => {
			messageListener = async (event: MessageEvent) => {
				const data = event.data;
				if (typeof data === 'string' && data.startsWith(SYNC_MESSAGE)) {
					const start = performance.now();
					try {
						const encryptedPayload = data.slice(1);
						const decryptedPayload = await decryptValue(
							encryptedPayload,
							encryptionKey,
						);
						if (typeof decryptedPayload !== 'string') {
							throw new Error('Decrypted payload is not a string');
						}
						const [fromClientId, toClientId, requestId, message, body] =
							jsonParseWithUndefined<
								[string, string | null, string | null, Message, unknown]
							>(decryptedPayload);

						if (
							fromClientId !== myClientId &&
							(toClientId == null || toClientId === myClientId)
						) {
							receive(fromClientId, requestId, message, body);
							logger.log(
								`[PERF] Incoming sync message processing took ${(performance.now() - start).toFixed(2)}ms`,
							);
						}
					} catch (error) {
						onIgnoredError?.(error);
					}
				}
			};
			connection.addEventListener(
				'message',
				messageListener as unknown as EventListener,
			);
		},
		() => {
			if (messageListener) {
				connection.removeEventListener(
					'message',
					messageListener as unknown as EventListener,
				);
			}
		},
		requestTimeoutSeconds,
		undefined,
		undefined,
		onIgnoredError,
	);
}
