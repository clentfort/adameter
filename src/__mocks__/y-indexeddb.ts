import { vi } from 'vitest';

let currentResolveWhenSynced: () => void;
let currentWhenSyncedPromise: Promise<void>;
let nextDbSize = 0;

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
	nextDbSize = 0;
};

export const setNextDbSize = (size: number) => {
	nextDbSize = size;
};

export const storeState = vi.fn().mockResolvedValue(undefined);

export class IndexeddbPersistence {
	public whenSynced: Promise<void>;
	public _dbsize: number;
	public name: string;
	public destroy: () => void;

	constructor(dbName: string, doc: unknown) {
		this.name = dbName;
		this.whenSynced = currentWhenSyncedPromise;
		this._dbsize = nextDbSize;
		this.destroy = vi.fn();
	}
}
