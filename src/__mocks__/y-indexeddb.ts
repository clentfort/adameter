// Mock for y-indexeddb

let currentResolveWhenSynced: () => void;
let currentWhenSyncedPromise: Promise<void>;

const setupNewWhenSynced = () => {
	currentWhenSyncedPromise = new Promise<void>((resolve) => {
		currentResolveWhenSynced = resolve;
	});
};

setupNewWhenSynced(); // Initialize for the first import

export const triggerWhenSynced = () => {
	if (currentResolveWhenSynced) {
		currentResolveWhenSynced();
	} else {
		// Optional: console.warn for debugging, but remove for final version
		// console.warn('triggerWhenSynced called but currentResolveWhenSynced is not set.');
	}
};

export const resetIndexeddbMock = () => {
	setupNewWhenSynced();
};

export class IndexeddbPersistence {
	public whenSynced: Promise<void>;

	constructor(dbName: string, doc: unknown) {
		this.whenSynced = currentWhenSyncedPromise;
	}

	// Add any other methods or properties that are used by yjs-context.tsx
	// For now, it seems only `whenSynced` is directly used.
}
