import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { getLocalStoreDbName, TINYBASE_LOCAL_DB_NAME } from './constants';

function createId(): string {
	return typeof crypto !== 'undefined' &&
		typeof crypto.randomUUID === 'function'
		? crypto.randomUUID()
		: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Identifies the current local store; changes when local data is reset. */
export function getLocalStoreId(): string {
	const existingId = getItem(STORAGE_KEYS.LOCAL_STORE_ID);
	if (existingId) {
		return existingId;
	}
	const id = createId();
	setItem(STORAGE_KEYS.LOCAL_STORE_ID, id);
	return id;
}

/**
 * The IndexedDB database of the current local store. Installs from before
 * the first reset keep using the original database.
 */
export function getLocalDbName(): string {
	return getItem(STORAGE_KEYS.LOCAL_DB_NAME) ?? TINYBASE_LOCAL_DB_NAME;
}

/**
 * Switches to a new, empty local store with its own database and sync state.
 * The old database is never loaded again, so tabs that still hold the old
 * store cannot bring its data back by saving it.
 */
export function rotateLocalStore(): void {
	const id = createId();
	setItem(STORAGE_KEYS.LOCAL_STORE_ID, id);
	setItem(STORAGE_KEYS.LOCAL_DB_NAME, getLocalStoreDbName(id));
}
