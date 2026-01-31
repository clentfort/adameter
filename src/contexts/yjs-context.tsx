'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
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

export const yjsContext = createContext<{
	doc: Doc;
	epoch: number;
	forceNewEpoch: () => void;
}>({
	doc: new Doc(),
	epoch: 1,
	forceNewEpoch: () => {},
});

interface YjsProviderProps {
	children: React.ReactNode;
}

const EPOCH_KEY = 'adameter-epoch';
const COMPACTION_THRESHOLD = 500 * 1024; // 500KB

export function YjsProvider({ children }: YjsProviderProps) {
	const [epoch, setEpoch] = useState(() => {
		if (typeof window === 'undefined') {
			return 1;
		}
		return Number(localStorage.getItem(EPOCH_KEY) || '1');
	});
	const [doc, setDoc] = useState(() => new Doc());

	const handleMigration = useCallback((newEpoch: number) => {
		localStorage.setItem(EPOCH_KEY, newEpoch.toString());
		setEpoch(newEpoch);
		setDoc(new Doc());
	}, []);

	useEffect(() => {
		const meta = doc.getMap('meta');
		const observer = () => {
			const migratedTo = meta.get('migratedTo') as number | undefined;
			if (migratedTo && migratedTo > epoch) {
				handleMigration(migratedTo);
			}
		};
		meta.observe(observer);
		return () => {
			meta.unobserve(observer);
		};
	}, [doc, epoch, handleMigration]);

	const onSynced = useCallback(() => {
		const size = encodeStateAsUpdate(doc).length;
		if (size > COMPACTION_THRESHOLD) {
			const newEpoch = epoch + 1;
			doc.getMap('meta').set('migratedTo', newEpoch);
			handleMigration(newEpoch);
		}
	}, [doc, epoch, handleMigration]);

	const forceNewEpoch = useCallback(() => {
		const newEpoch = epoch + 1;
		doc.getMap('meta').set('migratedTo', newEpoch);
		handleMigration(newEpoch);
	}, [doc, epoch, handleMigration]);

	const isSynced = useYjsPersistence(doc, epoch, onSynced);

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

	return (
		<yjsContext.Provider value={{ doc, epoch, forceNewEpoch }}>
			{children}
		</yjsContext.Provider>
	);
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

function useYjsPersistence(doc: Doc, epoch: number, onSynced?: () => void) {
	const [isSynced, setIsSynced] = useState(false);
	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}
		const dbName = epoch === 1 ? 'adameter' : `adameter-v${epoch}`;
		const persistence = new IndexeddbPersistence(dbName, doc);
		let isMounted = true;
		persistence.whenSynced.then(async () => {
			if (!isMounted) {
				return;
			}

			// Consolidate updates if there are many of them to improve loading times.
			// The default threshold is 500, but we use a more aggressive threshold
			// of 20 to keep the number of IndexedDB records low.
			if (persistence._dbsize > 20) {
				await storeState(persistence, true);
			}

			setIsSynced(true);
			onSynced?.();
		});
		return () => {
			isMounted = false;
			persistence.destroy();
		};
	}, [doc, epoch, onSynced]);

	return isSynced;
}
