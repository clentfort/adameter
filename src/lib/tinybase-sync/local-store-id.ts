import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

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
	return rotateLocalStoreId();
}

export function rotateLocalStoreId(): string {
	const id = createId();
	setItem(STORAGE_KEYS.LOCAL_STORE_ID, id);
	return id;
}
