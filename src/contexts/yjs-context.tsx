'use client';

import { createContext, useEffect, useState } from 'react';
import { bind } from 'valtio-yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Array, Doc, Map } from 'yjs';
import { SplashScreen } from '@/components/splash-screen';
import { diaperChanges } from '@/data/diaper-changes';
import { events } from '@/data/events';
import { feedingInProgress } from '@/data/feeding-in-progress';
import { feedingSessions } from '@/data/feeding-sessions';
import { growthMeasurements } from '@/data/growth-measurments';
import { medicationRegimensProxy } from '@/data/medication-regimens';
import { medicationsProxy } from '@/data/medications';

const doc = new Doc();
export const yjsContext = createContext<{ doc: Doc }>({ doc });

interface YjsProviderProps {
	children: React.ReactNode;
}

export function YjsProvider({ children }: YjsProviderProps) {
	const isSynced = useYjsPersistence(doc);

	// useBindValtioToYjs(diaperChanges, doc.getArray('diaper-changes'));
	// useBindValtioToYjs(events, doc.getArray('events'));
	// useBindValtioToYjs(feedingSessions, doc.getArray('feeding-sessions'));
	// useBindValtioToYjs(growthMeasurements, doc.getArray('growth-measurments'));
	// useBindValtioToYjs(feedingInProgress, doc.getMap('feeding-in-progress'));
	// useBindValtioToYjs(medicationRegimensProxy, doc.getArray('medication-regimens'));
	// useBindValtioToYjs(medicationsProxy, doc.getArray('medications'));

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

	useEffect(() => {
		if (!isSynced) {
			return;
		}
		const hasCleared = window.localStorage.getItem('has-cleared-legacy-data');
		if (hasCleared === 'true') {
			return;
		}

		window.localStorage.setItem('has-cleared-legacy-data', 'true');

		for (const a of [
			'diaper-changes',
			'events',
			'feeding-sessions',
			'growth-measurments',
			'medication-regimens',
			'medications',
		]) {
			if (doc.share.has(a)) {
				doc.share.delete(a);
			}
		}

		if (doc.share.has('feeding-in-progress')) {
			doc.share.delete('feeding-in-progress');
		}
	}, [isSynced]);

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
		const persistence = new IndexeddbPersistence('adameter', doc);
		let isMounted = true;
		persistence.whenSynced.then(() => {
			if (!isMounted) {
				return;
			}
			setIsSynced(true);
		});
		return () => {
			isMounted = false;
		};
	}, [doc]);

	return isSynced;
}
