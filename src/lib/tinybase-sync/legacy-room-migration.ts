import type { MergeableStore } from 'tinybase';
import { loadServerSnapshot } from 'tinybase-synchronizer-partykit-client-encrypted';
import { logger } from '@/lib/logger';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

// The managed PartyKit platform deletes all room data on this date.
export const LEGACY_PARTYKIT_SHUTDOWN = new Date('2026-10-23T00:00:00Z');

const LEGACY_FETCH_TIMEOUT_MS = 5000;

interface MergeLegacyRoomDataOptions {
	encryptionKey: CryptoKey;
	hashedRoomId: string;
	legacyHost?: string;
	now?: Date;
	store: MergeableStore;
	/** Snapshot URL of the room on the current server (`…/store`). */
	storeUrl: string;
}

/**
 * CRDT-merges room data from the retired managed PartyKit deployment into the
 * store. Two sources are tried, both holding the same opaque ciphertext:
 *
 * - the `legacy-store` slot on the current server, filled by the offline copy
 *   script (`scripts/migrate-legacy-rooms.mts`), which outlives the shutdown;
 * - the legacy host itself, until it shuts down. Reading it on every start
 *   also picks up writes from clients still running an older app version.
 *
 * Merging is idempotent, so repeated runs are harmless. Once the legacy host
 * is gone and the imported slot was read, the room is marked as migrated.
 *
 * Returns whether any legacy data was merged.
 */
export async function mergeLegacyRoomData({
	encryptionKey,
	hashedRoomId,
	legacyHost,
	now = new Date(),
	store,
	storeUrl,
}: MergeLegacyRoomDataOptions): Promise<boolean> {
	if (getMigratedRooms().includes(hashedRoomId)) {
		return false;
	}

	let didMerge = false;
	let didReadImportedSnapshot = false;

	const importedSnapshotUrl = storeUrl.replace(/\/store$/, '/legacy-store');
	try {
		didMerge = await withTimeout(
			loadServerSnapshot(store, importedSnapshotUrl, encryptionKey),
		);
		didReadImportedSnapshot = true;
	} catch (error) {
		logger.warn('[MIGRATION] Could not read imported legacy snapshot:', error);
	}

	const isLegacyHostAlive = now < LEGACY_PARTYKIT_SHUTDOWN;
	if (legacyHost && isLegacyHostAlive) {
		const protocol = /^(localhost|127\.)/.test(legacyHost) ? 'http' : 'https';
		const legacyStoreUrl = `${protocol}://${legacyHost}/parties/tinybase/${hashedRoomId}/store`;
		try {
			const didMergeFromLegacyHost = await withTimeout(
				loadServerSnapshot(store, legacyStoreUrl, encryptionKey),
			);
			didMerge ||= didMergeFromLegacyHost;
		} catch (error) {
			logger.warn('[MIGRATION] Could not read legacy PartyKit room:', error);
		}
	}

	if (didMerge) {
		logger.log('[MIGRATION] Merged room data from legacy PartyKit');
	}

	if (didReadImportedSnapshot && !isLegacyHostAlive) {
		setMigratedRooms([...getMigratedRooms(), hashedRoomId]);
	}

	return didMerge;
}

function getMigratedRooms(): string[] {
	const raw = getItem(STORAGE_KEYS.LEGACY_ROOM_MIGRATIONS);
	if (!raw) {
		return [];
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((entry): entry is string => typeof entry === 'string')
			: [];
	} catch {
		return [];
	}
}

function setMigratedRooms(rooms: string[]) {
	setItem(STORAGE_KEYS.LEGACY_ROOM_MIGRATIONS, JSON.stringify(rooms));
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Timed out after ${LEGACY_FETCH_TIMEOUT_MS}ms`));
		}, LEGACY_FETCH_TIMEOUT_MS);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}
