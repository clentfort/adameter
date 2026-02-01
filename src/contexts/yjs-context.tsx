'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { bind } from 'valtio-yjs';
import { IndexeddbPersistence, storeState } from 'y-indexeddb';
import { Array, Doc, encodeStateAsUpdate, Map } from 'yjs';
import { mergeData } from '@/app/data/utils/csv';
import { SplashScreen } from '@/components/splash-screen';
import { diaperChanges } from '@/data/diaper-changes';
import { events } from '@/data/events';
import { feedingInProgress } from '@/data/feeding-in-progress';
import { feedingSessions } from '@/data/feeding-sessions';
import { growthMeasurements } from '@/data/growth-measurments';
import { medicationRegimensProxy } from '@/data/medication-regimens';
import { medicationsProxy } from '@/data/medications';
import { getOrCreateClientId } from '@/lib/client-id';

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
	const clientId = getOrCreateClientId();
	const [epoch, setEpoch] = useState(() => {
		if (typeof window === 'undefined') {
			return 1;
		}
		return Number(localStorage.getItem(EPOCH_KEY) || '1');
	});
	const [doc, setDoc] = useState(() => new Doc());

	const handleMigration = useCallback(
		(newEpoch: number, seederId?: string) => {
			const amISeeder = seederId === clientId;

			if (!amISeeder) {
				// To avoid data duplication when multiple clients migrate at the same
				// time, followers clear their local state and wait for the seeder
				// to populate the new document.
				const diaperChangesBackup = [...diaperChanges];
				const eventsBackup = [...events];
				const feedingSessionsBackup = [...feedingSessions];
				const growthMeasurementsBackup = [...growthMeasurements];
				const medicationRegimensBackup = [...medicationRegimensProxy];
				const medicationsBackup = [...medicationsProxy];
				const feedingInProgressBackup = feedingInProgress.current;

				diaperChanges.length = 0;
				events.length = 0;
				feedingSessions.length = 0;
				growthMeasurements.length = 0;
				medicationRegimensProxy.length = 0;
				medicationsProxy.length = 0;
				feedingInProgress.current = null;

				// Rescue mechanism: if the document remains empty for too long,
				// assume the seeder failed and restore from backup.
				setTimeout(() => {
					if (diaperChanges.length === 0 && diaperChangesBackup.length > 0) {
						mergeData(diaperChanges, diaperChangesBackup);
					}
					if (events.length === 0 && eventsBackup.length > 0) {
						mergeData(events, eventsBackup);
					}
					if (
						feedingSessions.length === 0 &&
						feedingSessionsBackup.length > 0
					) {
						mergeData(feedingSessions, feedingSessionsBackup);
					}
					if (
						growthMeasurements.length === 0 &&
						growthMeasurementsBackup.length > 0
					) {
						mergeData(growthMeasurements, growthMeasurementsBackup);
					}
					if (
						medicationRegimensProxy.length === 0 &&
						medicationRegimensBackup.length > 0
					) {
						mergeData(medicationRegimensProxy, medicationRegimensBackup);
					}
					if (medicationsProxy.length === 0 && medicationsBackup.length > 0) {
						mergeData(medicationsProxy, medicationsBackup);
					}
					if (
						feedingInProgress.current === null &&
						feedingInProgressBackup !== null
					) {
						feedingInProgress.current = feedingInProgressBackup;
					}
				}, 10000);
			}

			localStorage.setItem(EPOCH_KEY, newEpoch.toString());
			setEpoch(newEpoch);
			setDoc(new Doc());
		},
		[clientId],
	);

	useEffect(() => {
		const meta = doc.getMap('meta');
		const observer = () => {
			const migratedToVal = meta.get('migratedTo');
			let newEpoch: number | undefined;
			let seederId: string | undefined;

			if (typeof migratedToVal === 'number') {
				newEpoch = migratedToVal;
			} else if (typeof migratedToVal === 'object' && migratedToVal !== null) {
				newEpoch = (migratedToVal as any).epoch;
				seederId = (migratedToVal as any).seederId;
			}

			if (newEpoch && newEpoch > epoch) {
				handleMigration(newEpoch, seederId);
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
			doc
				.getMap('meta')
				.set('migratedTo', { epoch: newEpoch, seederId: clientId });
			handleMigration(newEpoch, clientId);
		}
	}, [doc, epoch, handleMigration, clientId]);

	const forceNewEpoch = useCallback(() => {
		const newEpoch = epoch + 1;
		doc
			.getMap('meta')
			.set('migratedTo', { epoch: newEpoch, seederId: clientId });
		handleMigration(newEpoch, clientId);
	}, [doc, epoch, handleMigration, clientId]);

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
