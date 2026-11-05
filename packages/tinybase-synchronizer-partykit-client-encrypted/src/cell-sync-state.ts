/**
 * What a device knows about the server's copy of a room: the HLC the server
 * has for each cell (its "server stamps") and the server's epoch of the room.
 *
 * Both only ever claim that the server has a cell at least as new, which stays
 * true whatever happens to the local store. Anything that describes the local
 * store's content, like the last pulled sequence number, is kept in the store
 * itself instead, so it is always persisted together with that content.
 */
export interface CellSyncState {
	/** The server's epoch for the room; it changes when its cells are reset. */
	serverEpoch?: string;
	stamps: Map<string, string>;
}

export interface CellSyncStateUpdate {
	serverEpoch?: string;
	stamps?: Iterable<[cellKey: string, hlc: string]>;
}

export interface CellSyncStateStore {
	/** Removes all state, e.g. when the server lost the room's cells. */
	clear(): Promise<void>;
	close(): void;
	load(): Promise<CellSyncState>;
	save(update: CellSyncStateUpdate): Promise<void>;
}

const STAMPS_STORE = 'stamps';
const META_STORE = 'meta';
const SERVER_EPOCH_KEY = 'serverEpoch';

export function createMemoryCellSyncStateStore(): CellSyncStateStore {
	let state: CellSyncState = { stamps: new Map() };
	return {
		clear: async () => {
			state = { stamps: new Map() };
		},
		close: () => {},
		load: async () => ({ ...state, stamps: new Map(state.stamps) }),
		save: async ({ serverEpoch, stamps }) => {
			if (serverEpoch !== undefined) state.serverEpoch = serverEpoch;
			for (const [key, hlc] of stamps ?? []) state.stamps.set(key, hlc);
		},
	};
}

function requestToPromise<Result>(
	request: IDBRequest<Result>,
): Promise<Result> {
	return new Promise((resolve, reject) => {
		request.addEventListener('success', () => resolve(request.result));
		request.addEventListener('error', () => reject(request.error));
	});
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		transaction.addEventListener('complete', () => resolve());
		transaction.addEventListener('error', () => reject(transaction.error));
		transaction.addEventListener('abort', () => reject(transaction.error));
	});
}

function openDatabase(name: string): Promise<IDBDatabase> {
	const request = indexedDB.open(name, 1);
	request.addEventListener('upgradeneeded', () => {
		request.result.createObjectStore(STAMPS_STORE);
		request.result.createObjectStore(META_STORE);
	});
	return requestToPromise(request);
}

/** Persists the sync state of one room in its own IndexedDB database. */
export function createIndexedDbCellSyncStateStore(
	databaseName: string,
): CellSyncStateStore {
	const database = openDatabase(databaseName);

	const run = async (
		mode: IDBTransactionMode,
		operate: (stamps: IDBObjectStore, meta: IDBObjectStore) => void,
	) => {
		const transaction = (await database).transaction(
			[STAMPS_STORE, META_STORE],
			mode,
		);
		operate(
			transaction.objectStore(STAMPS_STORE),
			transaction.objectStore(META_STORE),
		);
		await transactionToPromise(transaction);
	};

	return {
		clear: () =>
			run('readwrite', (stamps, meta) => {
				stamps.clear();
				meta.clear();
			}),
		close: () => {
			void database.then((openedDatabase) => openedDatabase.close());
		},
		load: async () => {
			let keys: IDBValidKey[] = [];
			let hlcs: string[] = [];
			let serverEpoch: unknown;
			await run('readonly', (stamps, meta) => {
				void requestToPromise(stamps.getAllKeys()).then((result) => {
					keys = result;
				});
				void requestToPromise(stamps.getAll()).then((result) => {
					hlcs = result as string[];
				});
				void requestToPromise(meta.get(SERVER_EPOCH_KEY)).then((result) => {
					serverEpoch = result;
				});
			});
			return {
				serverEpoch: typeof serverEpoch === 'string' ? serverEpoch : undefined,
				stamps: new Map(keys.map((key, index) => [String(key), hlcs[index]])),
			};
		},
		save: ({ serverEpoch, stamps: updatedStamps }) =>
			run('readwrite', (stamps, meta) => {
				for (const [key, hlc] of updatedStamps ?? []) stamps.put(hlc, key);
				if (serverEpoch !== undefined) meta.put(serverEpoch, SERVER_EPOCH_KEY);
			}),
	};
}

/** Deletes the IndexedDB database of a room's sync state. */
export async function deleteCellSyncStateDatabase(
	databaseName: string,
): Promise<void> {
	await requestToPromise(indexedDB.deleteDatabase(databaseName));
}
