import { vi } from 'vitest';

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

export const storeState = vi.fn(() => Promise.resolve());

export const resetIndexeddbMock = () => {
	setupNewWhenSynced();
	storeState.mockClear();
};

export class IndexeddbPersistence {
	public whenSynced: Promise<void>;
	public _dbsize: number;

	constructor(dbName: string, doc: unknown) {
		this._dbsize = (this.constructor.prototype as any)._dbsize || 0;
		this.whenSynced = currentWhenSyncedPromise;
	}

	public destroy() {
		return Promise.resolve();
	}
}
