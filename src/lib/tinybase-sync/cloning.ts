import type { Content, MergeableStore } from 'tinybase';
import { decryptContent } from 'tinybase-persister-partykit-client-encrypted';
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

	const body = await response.text();
	if (!body || body === 'null') {
		throw new Error('No content found in the source room.');
	}

	// Detect format: the old persister server returns JSON (starts with '['),
	// while the new relay server returns a base64-encoded encrypted blob.
	if (body.startsWith('[')) {
		// Old persister format: JSON Content [Tables, Values] with encrypted values
		const encryptedContent = JSON.parse(body) as Content;
		const content = await decryptContent(encryptedContent, encryptionKey);
		store.setContent(content);
	} else {
		// New synchronizer format: single encrypted MergeableContent blob
		const decrypted = await decrypt(body, encryptionKey);
		const mergeableContent = jsonParseWithUndefined(decrypted);
		if (!mergeableContent) {
			throw new Error('Failed to parse decrypted content.');
		}
		store.applyMergeableChanges(
			mergeableContent as Parameters<typeof store.applyMergeableChanges>[0],
		);
	}
}
