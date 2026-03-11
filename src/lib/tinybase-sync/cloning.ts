import type { Store } from 'tinybase';
import {
	decryptContent,
	getEncryptionKey,
	hashRoomId,
} from 'tinybase-persister-partykit-client-encrypted';

export async function cloneRoomData(
	sourceRoomName: string,
	sourceHost: string,
	store: Store,
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

	const encryptedContent = await response.json();

	if (!encryptedContent) {
		throw new Error('No content found in the source room.');
	}

	const decryptedContent = await decryptContent(
		encryptedContent,
		encryptionKey,
	);

	store.setContent(decryptedContent);
}
