'use client';

import { createContext, useEffect, useState } from 'react';
import { bind } from 'valtio-yjs';
import { IndexeddbPersistence, storeState } from 'y-indexeddb';
import { Array, Doc, Map } from 'yjs';
import { SplashScreen } from '@/components/splash-screen';
import { diaperChanges } from '@/data/diaper-changes';
import { events } from '@/data/events';
import { feedingInProgress } from '@/data/feeding-in-progress';
import { feedingSessions } from '@/data/feeding-sessions';
import { growthMeasurements } from '@/data/growth-measurments';
import { medicationRegimensProxy } from '@/data/medication-regimens';
import { medicationsProxy } from '@/data/medications';
import {
	applyYjsEpochSnapshot,
	consumeYjsEpochSnapshot,
} from '@/data/yjs-epoch-snapshot';
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
				applyYjsEpochSnapshot(pendingSnapshot);
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

			hydrationTimer.end({
				metadata: {
					dbSize: dbSize ?? -1,
					epoch,
					mode,
					persistenceName,
				},
			});
			setIsSynced(true);
		});
		return () => {
			isMounted = false;
		};
	}, [doc]);

	return isSynced;
}
