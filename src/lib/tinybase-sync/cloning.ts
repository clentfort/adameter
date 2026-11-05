import type { MergeableStore } from 'tinybase';
import {
	createCellSync,
	createMemoryCellSyncStateStore,
	fetchLegacySnapshot,
	getCellKeys,
	hashRoomId,
} from 'tinybase-synchronizer-partykit-client-encrypted';
import { TINYBASE_PARTYKIT_PARTY } from './partykit-parties';

/**
 * Merges all data of another room into the store: its cells and, while
 * clients of the snapshot protocol may still write it, its legacy snapshot.
 */
export async function cloneRoomData(
	sourceRoomName: string,
	sourceHost: string,
	store: MergeableStore,
) {
	const [roomHash, keys] = await Promise.all([
		hashRoomId(sourceRoomName),
		getCellKeys(sourceRoomName),
	]);

	const protocol =
		sourceHost.startsWith('localhost') || sourceHost.startsWith('127.0.0.1')
			? 'http'
			: 'https';
	const roomUrl = `${protocol}://${sourceHost}/parties/${TINYBASE_PARTYKIT_PARTY}/${roomHash}`;

	const cellSync = createCellSync({
		cellsUrl: `${roomUrl}/cells`,
		keys,
		state: createMemoryCellSyncStateStore(),
		store,
	});
	let applied: number;
	try {
		await cellSync.init();
		({ applied } = await cellSync.pull());
	} finally {
		await cellSync.dispose();
	}

	const legacySnapshot = await fetchLegacySnapshot(
		`${roomUrl}/store`,
		keys.encryptionKey,
	);
	const legacyContent =
		legacySnapshot.status === 'loaded' ? legacySnapshot.content : undefined;
	if (legacyContent) {
		store.applyMergeableChanges(legacyContent);
	}

	if (applied === 0 && !legacyContent) {
		throw new Error('No content found in the source room.');
	}
}
