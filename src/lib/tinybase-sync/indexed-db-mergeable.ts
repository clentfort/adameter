import { MergeableContent, MergeableStore } from 'tinybase';
import { createCustomPersister } from 'tinybase/persisters';

const TABLES_STORE = 't';
const VALUES_STORE = 'v';
const METADATA_STORE = 'm';

/**
 * Creates a persister for MergeableStore that stores data in a readable format in IndexedDB.
 * Tables are stored in the 't' store as 'tableId/rowId' -> RowStamp.
 * Values are stored in the 'v' store as 'valueId' -> ValueStamp.
 * Metadata (HLCs and hashes) are stored in the 'm' store.
 */
export function createMergeableIndexedDbPersister(
	store: MergeableStore,
	dbName: string,
	onIgnoredError?: (error: unknown) => void,
) {
	const getDb = (): Promise<IDBDatabase> => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(dbName, 1);
			request.onupgradeneeded = () => {
				const db = request.result;
				if (!db.objectStoreNames.contains(TABLES_STORE)) {
					db.createObjectStore(TABLES_STORE);
				}
				if (!db.objectStoreNames.contains(VALUES_STORE)) {
					db.createObjectStore(VALUES_STORE);
				}
				if (!db.objectStoreNames.contains(METADATA_STORE)) {
					db.createObjectStore(METADATA_STORE);
				}
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	};

	const getPersisted = async (): Promise<MergeableContent | undefined> => {
		try {
			const db = await getDb();
			const transaction = db.transaction(
				[TABLES_STORE, VALUES_STORE, METADATA_STORE],
				'readonly',
			);

			const valuesThing: any = {};
			await new Promise((resolve, reject) => {
				const request = transaction.objectStore(VALUES_STORE).openCursor();
				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor) {
						valuesThing[cursor.key as string] = cursor.value;
						cursor.continue();
					} else {
						resolve(null);
					}
				};
				request.onerror = () => reject(request.error);
			});

			const valuesMeta = await new Promise<any>((resolve) => {
				const request = transaction.objectStore(METADATA_STORE).get('values');
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => resolve(undefined);
			});

			const tablesThing: any = {};
			await new Promise((resolve, reject) => {
				const request = transaction.objectStore(TABLES_STORE).openCursor();
				request.onsuccess = (event) => {
					const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
					if (cursor) {
						const key = cursor.key as string;
						const slashIndex = key.indexOf('/');
						if (slashIndex !== -1) {
							const tableId = key.substring(0, slashIndex);
							const rowId = key.substring(slashIndex + 1);
							if (!tablesThing[tableId]) {
								tablesThing[tableId] = [{}, '', 0];
							}
							tablesThing[tableId][0][rowId] = cursor.value;
						}
						cursor.continue();
					} else {
						resolve(null);
					}
				};
				request.onerror = () => reject(request.error);
			});

			const tableIds = Object.keys(tablesThing);
			for (const tableId of tableIds) {
				const tableMeta = await new Promise<any>((resolve) => {
					const request = transaction
						.objectStore(METADATA_STORE)
						.get(`table:${tableId}`);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => resolve(undefined);
				});
				if (tableMeta) {
					tablesThing[tableId][1] = tableMeta[0];
					tablesThing[tableId][2] = tableMeta[1];
				}
			}

			const tablesMeta = await new Promise<any>((resolve) => {
				const request = transaction.objectStore(METADATA_STORE).get('tables');
				request.onsuccess = () => resolve(request.result);
				request.onerror = () => resolve(undefined);
			});

			if (
				Object.keys(tablesThing).length === 0 &&
				Object.keys(valuesThing).length === 0 &&
				!tablesMeta &&
				!valuesMeta
			) {
				return undefined;
			}

			return [
				[tablesThing, tablesMeta?.[0] ?? '', tablesMeta?.[1] ?? 0],
				[valuesThing, valuesMeta?.[0] ?? '', valuesMeta?.[1] ?? 0],
			] as MergeableContent;
		} catch (error) {
			onIgnoredError?.(error);
			return undefined;
		}
	};

	const setPersisted = async (
		getContent: () => MergeableContent,
	): Promise<void> => {
		try {
			const db = await getDb();
			const [mergeableTables, mergeableValues] = getContent();
			const transaction = db.transaction(
				[TABLES_STORE, VALUES_STORE, METADATA_STORE],
				'readwrite',
			);

			const tablesStore = transaction.objectStore(TABLES_STORE);
			const valuesStore = transaction.objectStore(VALUES_STORE);
			const metadataStore = transaction.objectStore(METADATA_STORE);

			tablesStore.clear();
			valuesStore.clear();
			metadataStore.clear();

			const [tablesThing, tablesHlc, tablesHash] = mergeableTables;
			for (const [tableId, tableStamp] of Object.entries(tablesThing)) {
				const [rowsThing, tableHlc, tableHash] = tableStamp;
				for (const [rowId, rowStamp] of Object.entries(rowsThing)) {
					tablesStore.put(rowStamp, `${tableId}/${rowId}`);
				}
				metadataStore.put([tableHlc, tableHash], `table:${tableId}`);
			}
			metadataStore.put([tablesHlc, tablesHash], 'tables');

			const [valuesThing, valuesHlc, valuesHash] = mergeableValues;
			for (const [valueId, valueStamp] of Object.entries(valuesThing)) {
				valuesStore.put(valueStamp, valueId);
			}
			metadataStore.put([valuesHlc, valuesHash], 'values');

			return new Promise((resolve, reject) => {
				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(transaction.error);
			});
		} catch (error) {
			onIgnoredError?.(error);
		}
	};

	return createCustomPersister(
		store,
		getPersisted,
		setPersisted,
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

/**
 * Migration helper to load from the old blob-based mergeable format.
 */
export function createMergeableBlobIndexedDbPersister(
	store: MergeableStore,
	dbName: string,
) {
	const STORE_NAME = 'mergeable_v1';
	const KEY = 'content';

	const getDb = (): Promise<IDBDatabase> => {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(dbName);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	};

	return createCustomPersister(
		store,
		async () => {
			try {
				const db = await getDb();
				if (!db.objectStoreNames.contains(STORE_NAME)) return undefined;
				return new Promise((resolve) => {
					const transaction = db.transaction(STORE_NAME, 'readonly');
					const request = transaction.objectStore(STORE_NAME).get(KEY);
					request.onsuccess = () => resolve(request.result);
					request.onerror = () => resolve(undefined);
				});
			} catch {
				return undefined;
			}
		},
		async () => {},
		() => {},
		() => {},
		undefined,
		2,
	);
}
