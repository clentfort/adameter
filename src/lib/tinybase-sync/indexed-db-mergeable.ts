import { MergeableStore } from 'tinybase';
import { createCustomPersister } from 'tinybase/persisters';

const STORE_NAME = 'mergeable_v1';
const KEY = 'content';

export function createMergeableIndexedDbPersister(
	store: MergeableStore,
	dbName: string,
	onIgnoredError?: (error: unknown) => void,
) {
	const getDb = (): Promise<IDBDatabase> => {
		return new Promise((resolve, reject) => {
			// Try to open existing database or create it
			const request = indexedDB.open(dbName);
			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
				}
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	};

	return createCustomPersister(
		store,
		async () => {
			try {
				const db = await getDb();
				return new Promise((resolve) => {
					const transaction = db.transaction(STORE_NAME, 'readonly');
					const request = transaction.objectStore(STORE_NAME).get(KEY);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => resolve(undefined);
				});
			} catch (error) {
				onIgnoredError?.(error);
				return undefined;
			}
		},
		async (getContent) => {
			try {
				const db = await getDb();
				return new Promise((resolve, reject) => {
					const transaction = db.transaction(STORE_NAME, 'readwrite');
					const request = transaction.objectStore(STORE_NAME).put(getContent(), KEY);
					request.onsuccess = () => resolve();
					request.onerror = () => reject(request.error);
				});
			} catch (error) {
				onIgnoredError?.(error);
			}
		},
		(listener) => {
			const interval = setInterval(listener, 1000);
			return interval;
		},
		(interval) => {
			clearInterval(interval);
		},
		onIgnoredError,
		2, // Persists.MergeableStoreOnly
	);
}
