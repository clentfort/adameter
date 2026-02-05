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
	logPerformanceEvent,
	startPerformanceTimer,
} from '@/lib/performance-logging';

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

		const hydrationTimer = startPerformanceTimer('yjs.hydration.total');
		const persistenceInitTimer = startPerformanceTimer('yjs.persistence.init');
		const persistence = new IndexeddbPersistence('adameter', doc);
		persistenceInitTimer.end();
		logPerformanceEvent('yjs.persistence.created');
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
				},
			});
			if (dbSize !== undefined) {
				logPerformanceEvent('yjs.persistence.dbsize', {
					value: dbSize,
				});
			}

			// Consolidate updates if there are many of them to improve loading times.
			// The default threshold is 500, but we use a more aggressive threshold
			// of 20 to keep the number of IndexedDB records low.
			if (dbSize !== undefined && dbSize > 20) {
				const compactionTimer = startPerformanceTimer(
					'yjs.persistence.compaction',
					{ dbSizeBefore: dbSize },
				);
				await storeState(persistence, true);
				compactionTimer.end();
			}

			hydrationTimer.end({
				metadata: {
					dbSize: dbSize ?? -1,
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
