import type { YjsEpochMode } from '@/lib/yjs-epoch';
import type { DiaperChange } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import type { FeedingInProgress } from '@/types/feeding-in-progress';
import type { GrowthMeasurement } from '@/types/growth';
import type { MedicationAdministration } from '@/types/medication';
import type { MedicationRegimen } from '@/types/medication-regimen';
import { diaperChanges } from './diaper-changes';
import { events } from './events';
import { feedingInProgress } from './feeding-in-progress';
import { feedingSessions } from './feeding-sessions';
import { growthMeasurements } from './growth-measurments';
import { medicationRegimensProxy } from './medication-regimens';
import { medicationsProxy } from './medications';

const SNAPSHOT_STORAGE_KEY_PREFIX = 'adameter-yjs-epoch-snapshot-v1';
const SNAPSHOT_DB_NAME = 'adameter-epoch-tools';
const SNAPSHOT_DB_VERSION = 1;
const SNAPSHOT_STORE_NAME = 'snapshots';

function getSnapshotRecordKey(mode: YjsEpochMode, epoch: number) {
	return `${mode}:${epoch}`;
}

function getSnapshotStorageKey(mode: YjsEpochMode, epoch: number) {
	return `${SNAPSHOT_STORAGE_KEY_PREFIX}:${mode}:${epoch}`;
}

export interface YjsEpochSnapshot {
	createdAt: string;
	diaperChanges: DiaperChange[];
	events: Event[];
	feedingInProgress: FeedingInProgress | null;
	feedingSessions: FeedingSession[];
	growthMeasurements: GrowthMeasurement[];
	medicationRegimens: MedicationRegimen[];
	medications: MedicationAdministration[];
}

function canUseStorage() {
	return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function canUseIndexedDb() {
	return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

let snapshotDbPromise: Promise<IDBDatabase> | undefined;

function openSnapshotDb() {
	if (!canUseIndexedDb()) {
		return Promise.reject(new Error('IndexedDB is unavailable.'));
	}

	if (snapshotDbPromise) {
		return snapshotDbPromise;
	}

	snapshotDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(SNAPSHOT_DB_NAME, SNAPSHOT_DB_VERSION);

		request.onupgradeneeded = () => {
			const database = request.result;
			if (!database.objectStoreNames.contains(SNAPSHOT_STORE_NAME)) {
				database.createObjectStore(SNAPSHOT_STORE_NAME);
			}
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onerror = () => {
			reject(request.error ?? new Error('Failed to open snapshot database.'));
		};
	});

	return snapshotDbPromise;
}

function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function replaceArray<T>(target: T[], next: T[]) {
	target.splice(0, target.length, ...next);
}

export function captureYjsEpochSnapshot(): YjsEpochSnapshot {
	return {
		createdAt: new Date().toISOString(),
		diaperChanges: deepClone([...diaperChanges]),
		events: deepClone([...events]),
		feedingInProgress: deepClone(feedingInProgress.current),
		feedingSessions: deepClone([...feedingSessions]),
		growthMeasurements: deepClone([...growthMeasurements]),
		medicationRegimens: deepClone([...medicationRegimensProxy]),
		medications: deepClone([...medicationsProxy]),
	};
}

async function saveSnapshotToIndexedDb(
	snapshot: YjsEpochSnapshot,
	{ epoch, mode }: { epoch: number; mode: YjsEpochMode },
) {
	const database = await openSnapshotDb();

	await new Promise<void>((resolve, reject) => {
		const transaction = database.transaction(SNAPSHOT_STORE_NAME, 'readwrite');
		const store = transaction.objectStore(SNAPSHOT_STORE_NAME);
		store.put(snapshot, getSnapshotRecordKey(mode, epoch));

		transaction.oncomplete = () => resolve();
		transaction.onerror = () => {
			reject(transaction.error ?? new Error('Failed to store snapshot.'));
		};
		transaction.onabort = () => {
			reject(transaction.error ?? new Error('Snapshot transaction aborted.'));
		};
	});
}

function saveSnapshotToLocalStorage(
	snapshot: YjsEpochSnapshot,
	{ epoch, mode }: { epoch: number; mode: YjsEpochMode },
) {
	if (!canUseStorage()) {
		throw new Error('localStorage is unavailable.');
	}

	localStorage.setItem(
		getSnapshotStorageKey(mode, epoch),
		JSON.stringify(snapshot),
	);
}

export async function saveYjsEpochSnapshot(
	snapshot: YjsEpochSnapshot,
	{ epoch, mode }: { epoch: number; mode: YjsEpochMode },
) {
	if (canUseIndexedDb()) {
		try {
			await saveSnapshotToIndexedDb(snapshot, { epoch, mode });
			if (canUseStorage()) {
				localStorage.removeItem(getSnapshotStorageKey(mode, epoch));
			}
			return;
		} catch {
			// Fall through to localStorage.
		}
	}

	saveSnapshotToLocalStorage(snapshot, { epoch, mode });
}

async function consumeSnapshotFromIndexedDb({
	epoch,
	mode,
}: {
	epoch: number;
	mode: YjsEpochMode;
}) {
	const database = await openSnapshotDb();

	return new Promise<YjsEpochSnapshot | undefined>((resolve, reject) => {
		const transaction = database.transaction(SNAPSHOT_STORE_NAME, 'readwrite');
		const store = transaction.objectStore(SNAPSHOT_STORE_NAME);
		const recordKey = getSnapshotRecordKey(mode, epoch);
		const request = store.get(recordKey);
		let snapshot: YjsEpochSnapshot | undefined;

		request.onsuccess = () => {
			snapshot = (request.result as YjsEpochSnapshot | undefined) ?? undefined;
			if (snapshot) {
				store.delete(recordKey);
			}
		};

		request.onerror = () => {
			reject(request.error ?? new Error('Failed to read snapshot.'));
		};

		transaction.oncomplete = () => resolve(snapshot);
		transaction.onerror = () => {
			reject(transaction.error ?? new Error('Failed to consume snapshot.'));
		};
		transaction.onabort = () => {
			reject(transaction.error ?? new Error('Snapshot consume aborted.'));
		};
	});
}

function consumeSnapshotFromLocalStorage({
	epoch,
	mode,
}: {
	epoch: number;
	mode: YjsEpochMode;
}) {
	if (!canUseStorage()) {
		return undefined;
	}

	const storageKey = getSnapshotStorageKey(mode, epoch);
	const rawSnapshot = localStorage.getItem(storageKey);
	if (!rawSnapshot) {
		return undefined;
	}

	localStorage.removeItem(storageKey);

	try {
		return JSON.parse(rawSnapshot) as YjsEpochSnapshot;
	} catch {
		return undefined;
	}
}

export async function consumeYjsEpochSnapshot({
	epoch,
	mode,
}: {
	epoch: number;
	mode: YjsEpochMode;
}) {
	if (canUseIndexedDb()) {
		try {
			const indexedDbSnapshot = await consumeSnapshotFromIndexedDb({
				epoch,
				mode,
			});
			if (indexedDbSnapshot) {
				if (canUseStorage()) {
					localStorage.removeItem(getSnapshotStorageKey(mode, epoch));
				}
				return indexedDbSnapshot;
			}
		} catch {
			// Fall back to localStorage.
		}
	}

	return consumeSnapshotFromLocalStorage({ epoch, mode });
}

export function applyYjsEpochSnapshot(snapshot: YjsEpochSnapshot) {
	replaceArray(diaperChanges, snapshot.diaperChanges ?? []);
	replaceArray(events, snapshot.events ?? []);
	replaceArray(feedingSessions, snapshot.feedingSessions ?? []);
	replaceArray(growthMeasurements, snapshot.growthMeasurements ?? []);
	replaceArray(medicationRegimensProxy, snapshot.medicationRegimens ?? []);
	replaceArray(medicationsProxy, snapshot.medications ?? []);
	feedingInProgress.current = snapshot.feedingInProgress ?? null;
}
