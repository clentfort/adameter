import type { MergeableStore } from 'tinybase';
import {
	decrypt,
	getEncryptionKey,
	hashRoomId,
	jsonParseWithUndefined,
} from 'tinybase-synchronizer-partykit-client-encrypted';

export async function cloneRoomData(
	sourceRoomName: string,
	sourceHost: string,
	store: MergeableStore,
) {
	const hashedRoomId = await hashRoomId(sourceRoomName);
	const encryptionKey = await getEncryptionKey(sourceRoomName);

	const protocol =
		sourceHost.startsWith('localhost') || sourceHost.startsWith('127.0.0.1')
			? 'http'
			: 'https';

	const storeUrl = `${protocol}://${sourceHost}/parties/tinybase/${hashedRoomId}/store`;

	const response = await fetch(storeUrl, {
		cache: 'no-store',
		mode: 'cors',
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch room data: ${response.statusText}`);
	}

	const encrypted = await response.text();
	if (!encrypted || encrypted === 'null') {
		throw new Error('No content found in the source room.');
	}

	const decrypted = await decrypt(encrypted, encryptionKey);
	const mergeableContent = jsonParseWithUndefined(decrypted);
	if (!mergeableContent) {
		throw new Error('Failed to parse decrypted content.');
	}

	store.applyMergeableChanges(
		mergeableContent as Parameters<typeof store.applyMergeableChanges>[0],
	);
}
