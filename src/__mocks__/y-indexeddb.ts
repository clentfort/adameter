let currentResolveWhenSynced: () => void;
let currentWhenSyncedPromise: Promise<void>;

const setupNewWhenSynced = () => {
	currentWhenSyncedPromise = new Promise<void>((resolve) => {
		currentResolveWhenSynced = resolve;
	});
};

setupNewWhenSynced();

export const triggerWhenSynced = () => {
	if (currentResolveWhenSynced) {
		currentResolveWhenSynced();
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
}
