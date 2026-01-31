'use client';

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

export const yjsContext = createContext<{ doc: Doc; epoch: number }>({
	doc: new Doc(),
	epoch: 1,
});

interface YjsProviderProps {
	children: React.ReactNode;
}

export function YjsProvider({ children }: YjsProviderProps) {
	const [epoch, setEpoch] = useState(() => {
		if (typeof window === 'undefined') return 1;
		return Number(localStorage.getItem('adameter-epoch') || '1');
	});
	const [doc, setDoc] = useState(() => new Doc());

	const isSynced = useYjsPersistence(doc, epoch);

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
		if (!isSynced) return;

		const checkCompaction = async () => {
			const update = encodeStateAsUpdate(doc);
			// Compact if document history gets too large (threshold: 500KB)
			if (update.length > 500 * 1024) {
				// To avoid multiple clients initiating migration at the same time,
				// we check if a migration has already been signaled.
				if (doc.getMap('meta').has('migratedTo')) return;

				console.log(
					'Document size exceeded threshold, migrating to next epoch',
				);
				const nextEpoch = epoch + 1;
				const newDoc = new Doc();

				// Copy current state to the fresh document.
				// By manually copying values into a new Doc, we discard the edit history
				// and tombstones, which significantly reduces the document size and
				// improves loading times.
				newDoc.transact(() => {
					for (const [name, type] of doc.share) {
						if (name === 'meta') continue;
						if (type instanceof Array) {
							newDoc.getArray(name).insert(0, type.toArray());
						} else if (type instanceof Map) {
							const newMap = newDoc.getMap(name);
							for (const [key, value] of type.entries()) {
								newMap.set(key, value);
							}
						}
					}
				});

				// Signal other clients to migrate as well
				doc.getMap('meta').set('migratedTo', nextEpoch);

				// Switch to the new document and epoch
				localStorage.setItem('adameter-epoch', nextEpoch.toString());
				setEpoch(nextEpoch);
				setDoc(newDoc);
			}
		};

		const interval = setInterval(checkCompaction, 60000);
		checkCompaction();
		return () => clearInterval(interval);
	}, [doc, epoch, isSynced]);

	useEffect(() => {
		const meta = doc.getMap('meta');
		const observer = () => {
			const nextEpoch = meta.get('migratedTo');
			if (typeof nextEpoch === 'number' && nextEpoch > epoch) {
				console.log(
					'Received migration signal from other client, switching to epoch',
					nextEpoch,
				);
				localStorage.setItem('adameter-epoch', nextEpoch.toString());
				setEpoch(nextEpoch);
				setDoc(new Doc()); // Start with a fresh doc; sync will fill it from the new room
			}
		};
		meta.observe(observer);
		return () => meta.unobserve(observer);
	}, [doc, epoch]);

	if (!isSynced) {
		return <SplashScreen />;
	}

	return (
		<yjsContext.Provider value={{ doc, epoch }}>{children}</yjsContext.Provider>
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

function useYjsPersistence(doc: Doc, epoch: number) {
	const [isSynced, setIsSynced] = useState(false);
	useEffect(() => {
		if (typeof window === 'undefined') {
			return undefined;
		}
		setIsSynced(false);
		const persistence = new IndexeddbPersistence(`adameter-v${epoch}`, doc);
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
		});
		return () => {
			isMounted = false;
			persistence.destroy();
		};
	}, [doc, epoch]);

	return isSynced;
}
