'use client';

import type { YjsEpochSnapshot } from '@/data/yjs-epoch-snapshot';
import { createContext, useEffect, useState } from 'react';
import { bind } from 'valtio-yjs';
import { IndexeddbPersistence, storeState } from 'y-indexeddb';
import { Array, Doc, encodeStateAsUpdate, Map } from 'yjs';
import { SplashScreen } from '@/components/splash-screen';
import { diaperChanges } from '@/data/diaper-changes';
import { events } from '@/data/events';
import { feedingInProgress } from '@/data/feeding-in-progress';
import { feedingSessions } from '@/data/feeding-sessions';
import { growthMeasurements } from '@/data/growth-measurments';
import { medicationRegimensProxy } from '@/data/medication-regimens';
import { medicationsProxy } from '@/data/medications';
import { consumeYjsEpochSnapshot } from '@/data/yjs-epoch-snapshot';
import {
	logPerformanceEvent,
	startPerformanceTimer,
} from '@/lib/performance-logging';
import {
	getYjsEpoch,
	getYjsEpochMode,
	getYjsPersistenceName,
} from '@/lib/yjs-epoch';

const doc = new Doc();
export const yjsContext = createContext<{ doc: Doc }>({ doc });

interface YjsProviderProps {
	children: React.ReactNode;
}

export function YjsProvider({ children }: YjsProviderProps) {
	const isSynced = useYjsPersistence(doc);

	useBindValtioToYjs(diaperChanges, doc.getArray('diaper-changes-dec'));
	useBindValtioToYjs(events, doc.getArray('events-dec'));
	useBindValtioToYjs(feedingSessions, doc.getArray('feeding-sessions-dec'));
	useBindValtioToYjs(
		growthMeasurements,
		doc.getArray('growth-measurments-dec'),
	);
	useBindValtioToYjs(feedingInProgress, doc.getMap('feeding-in-progress-dec'));
	useBindValtioToYjs(
		medicationRegimensProxy,
		doc.getArray('medication-regimens-dec'),
	);
	useBindValtioToYjs(medicationsProxy, doc.getArray('medications-dec'));

	if (!isSynced) {
		return <SplashScreen />;
	}

	return <yjsContext.Provider value={{ doc }}>{children}</yjsContext.Provider>;
}

function useBindValtioToYjs<T>(state: T[], yArray: Array<T>): void;
function useBindValtioToYjs<T>(state: Record<string, T>, yMap: Map<T>): void;
function useBindValtioToYjs<T>(
	state: Record<string, T> | T[],
	yMap: Map<T> | Array<T>,
) {
	useEffect(() => {
		const unbind = bind(state, yMap);
		return () => {
			unbind();
		};
	}, [state, yMap]);
}

function replaceYArray<T>(target: Array<T>, next: ReadonlyArray<T>) {
	if (target.length > 0) {
		target.delete(0, target.length);
	}

	if (next.length > 0) {
		target.insert(0, [...next]);
	}
}

function applyYjsEpochSnapshotToDoc(doc: Doc, snapshot: YjsEpochSnapshot) {
	doc.transact(() => {
		replaceYArray(doc.getArray('diaper-changes-dec'), snapshot.diaperChanges);
		replaceYArray(doc.getArray('events-dec'), snapshot.events);
		replaceYArray(
			doc.getArray('feeding-sessions-dec'),
			snapshot.feedingSessions,
		);
		replaceYArray(
			doc.getArray('growth-measurments-dec'),
			snapshot.growthMeasurements,
		);
		replaceYArray(
			doc.getArray('medication-regimens-dec'),
			snapshot.medicationRegimens,
		);
		replaceYArray(doc.getArray('medications-dec'), snapshot.medications);

		const feedingInProgressMap = doc.getMap('feeding-in-progress-dec');
		feedingInProgressMap.clear();
		feedingInProgressMap.set('current', snapshot.feedingInProgress ?? null);
	}, 'epoch-snapshot-import');
}

async function countIndexedDbUpdates(databaseName: string) {
	if (typeof indexedDB === 'undefined') {
		return undefined;
	}

	return await new Promise<number | undefined>((resolve) => {
		const openRequest = indexedDB.open(databaseName);
		let isResolved = false;

		const finalize = (value: number | undefined) => {
			if (isResolved) {
				return;
			}
			isResolved = true;
			resolve(value);
		};

		openRequest.onerror = () => {
			finalize(undefined);
		};

		openRequest.onsuccess = () => {
			const database = openRequest.result;

			if (!database.objectStoreNames.contains('updates')) {
				database.close();
				finalize(undefined);
				return;
			}

			const transaction = database.transaction('updates', 'readonly');
			const updatesStore = transaction.objectStore('updates');
			const countRequest = updatesStore.count();

			countRequest.onerror = () => {
				database.close();
				finalize(undefined);
			};

			countRequest.onsuccess = () => {
				database.close();
				finalize(
					typeof countRequest.result === 'number'
						? countRequest.result
						: undefined,
				);
			};

			transaction.onabort = () => {
				database.close();
				finalize(undefined);
			};

			transaction.onerror = () => {
				database.close();
				finalize(undefined);
			};
		};
	});
}

function useYjsPersistence(doc: Doc) {
	const [isSynced, setIsSynced] = useState(false);
	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}

		const epoch = getYjsEpoch();
		const mode = getYjsEpochMode();
		const persistenceName = getYjsPersistenceName(epoch, mode);
		const hydrationTimer = startPerformanceTimer('yjs.hydration.total');
		const persistenceInitTimer = startPerformanceTimer('yjs.persistence.init');
		const persistence = new IndexeddbPersistence(persistenceName, doc);
		persistenceInitTimer.end();
		logPerformanceEvent('yjs.persistence.created', {
			metadata: { epoch, mode, persistenceName },
		});
		let isMounted = true;
		const whenSyncedTimer = startPerformanceTimer('yjs.persistence.whenSynced');
		persistence.whenSynced.then(async () => {
			if (!isMounted) {
				return;
			}

			const dbSize =
				typeof persistence._dbsize === 'number'
					? persistence._dbsize
					: undefined;
			whenSyncedTimer.end({
				metadata: {
					dbSize: dbSize ?? -1,
					epoch,
					mode,
					persistenceName,
				},
			});
			if (dbSize !== undefined) {
				logPerformanceEvent('yjs.persistence.dbsize', {
					metadata: {
						epoch,
						mode,
					},
					value: dbSize,
				});
			}

			const encodedSizeAfterSync = encodeStateAsUpdate(doc).length;
			logPerformanceEvent('yjs.document.encoded-size.bytes', {
				metadata: {
					epoch,
					mode,
					phase: 'after-whenSynced',
					persistenceName,
				},
				value: encodedSizeAfterSync,
			});

			const updateCountAfterSync = await countIndexedDbUpdates(persistenceName);
			if (typeof updateCountAfterSync === 'number') {
				logPerformanceEvent('yjs.persistence.updates.count', {
					metadata: {
						dbSizeReported: dbSize ?? -1,
						epoch,
						mode,
						phase: 'after-whenSynced',
						persistenceName,
					},
					value: updateCountAfterSync,
				});
			}

			// Consolidate updates if there are many of them to improve loading times.
			// The default threshold is 500, but we use a more aggressive threshold
			// of 20 to keep the number of IndexedDB records low.
			if (dbSize !== undefined && dbSize > 20) {
				const compactionTimer = startPerformanceTimer(
					'yjs.persistence.compaction',
					{ dbSizeBefore: dbSize, epoch, mode },
				);
				await storeState(persistence, true);
				compactionTimer.end();
			}

			const pendingSnapshot = await consumeYjsEpochSnapshot({ epoch, mode });
			if (pendingSnapshot) {
				const snapshotApplyTimer = startPerformanceTimer(
					'yjs.epoch.snapshot.apply',
					{
						epoch,
						mode,
						snapshotCreatedAt: pendingSnapshot.createdAt,
					},
				);
				applyYjsEpochSnapshotToDoc(doc, pendingSnapshot);

				const encodedSizeAfterSnapshotApply = encodeStateAsUpdate(doc).length;
				logPerformanceEvent('yjs.document.encoded-size.bytes', {
					metadata: {
						epoch,
						mode,
						phase: 'after-snapshot-apply',
						persistenceName,
					},
					value: encodedSizeAfterSnapshotApply,
				});
				snapshotApplyTimer.end({
					metadata: {
						diaperCount: pendingSnapshot.diaperChanges.length,
						eventCount: pendingSnapshot.events.length,
						feedingCount: pendingSnapshot.feedingSessions.length,
						growthCount: pendingSnapshot.growthMeasurements.length,
						medicationCount: pendingSnapshot.medications.length,
						regimenCount: pendingSnapshot.medicationRegimens.length,
					},
				});
			}

			const encodedSizeAtHydrationReady = encodeStateAsUpdate(doc).length;
			logPerformanceEvent('yjs.document.encoded-size.bytes', {
				metadata: {
					epoch,
					mode,
					phase: 'hydration-ready',
					persistenceName,
				},
				value: encodedSizeAtHydrationReady,
			});

			const updateCountAtHydrationReady =
				await countIndexedDbUpdates(persistenceName);
			if (typeof updateCountAtHydrationReady === 'number') {
				logPerformanceEvent('yjs.persistence.updates.count', {
					metadata: {
						epoch,
						mode,
						phase: 'hydration-ready',
						persistenceName,
					},
					value: updateCountAtHydrationReady,
				});
			}

			hydrationTimer.end({
				metadata: {
					dbSize: dbSize ?? -1,
					epoch,
					mode,
					persistenceName,
				},
			});
			setIsSynced(true);

			if (pendingSnapshot) {
				setTimeout(() => {
					void (async () => {
						if (!isMounted) {
							return;
						}

						const postSnapshotCompactionTimer = startPerformanceTimer(
							'yjs.persistence.compaction.post-snapshot',
							{
								epoch,
								mode,
								persistenceName,
							},
						);
						await storeState(persistence, true);
						postSnapshotCompactionTimer.end();

						const encodedSizeAfterSnapshotCompaction =
							encodeStateAsUpdate(doc).length;
						logPerformanceEvent('yjs.document.encoded-size.bytes', {
							metadata: {
								epoch,
								mode,
								phase: 'after-snapshot-compaction',
								persistenceName,
							},
							value: encodedSizeAfterSnapshotCompaction,
						});

						const updateCountAfterSnapshotCompaction =
							await countIndexedDbUpdates(persistenceName);
						if (typeof updateCountAfterSnapshotCompaction === 'number') {
							logPerformanceEvent('yjs.persistence.updates.count', {
								metadata: {
									epoch,
									mode,
									phase: 'after-snapshot-compaction',
									persistenceName,
								},
								value: updateCountAfterSnapshotCompaction,
							});
						}
					})();
				}, 0);
			}
		});
		return () => {
			isMounted = false;
		};
	}, [doc]);

	return isSynced;
}
