import type { MergeableStore } from 'tinybase';
import {
	applyCellsToStore,
	createCellSync,
	createMemoryCellSyncStateStore,
	fetchLegacySnapshot,
	flattenChanges,
	getCellKeys,
	hashRoomId,
	isLocalValueId,
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
		if (cellSync.getPullRetry()) {
			throw new Error('Could not copy all data of the source room.');
		}
	} finally {
		await cellSync.dispose();
	}

	const legacySnapshot = await fetchLegacySnapshot(
		`${roomUrl}/store`,
		keys.encryptionKey,
	);
	const legacyCells =
		legacySnapshot.status === 'loaded' && legacySnapshot.content
			? flattenChanges(legacySnapshot.content).filter(
					(cell) => !(cell.kind === 'v' && isLocalValueId(cell.cell)),
				)
			: [];
	const { deferred, invalid } = applyCellsToStore(store, legacyCells);
	if (deferred.length > 0 || invalid.length > 0) {
		throw new Error('Could not copy all data of the source room.');
	}

	if (applied === 0 && legacyCells.length === 0) {
		throw new Error('No content found in the source room.');
	}
}
