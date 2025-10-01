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
import { useEncryptionKey } from '@/hooks/use-encryption-key';
import { decrypt, encrypt, Encrypted } from '@/utils/crypto';

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

	const key = useEncryptionKey();

	useEffect(() => {
		if (!isSynced) {
			return;
		}
		const hasMigrated = window.localStorage.getItem('has-decrypted');
		if (hasMigrated === 'true') {
			return;
		}

		window.localStorage.setItem('has-decrypted', 'true');

		for (const a of [
			'diaper-changes',
			'events',
			'feeding-sessions',
			'growth-measurments',
			'medication-regimens',
			'medications',
		]) {
			const yjsArrayEnc = doc.getArray(a);
			const yjsArrayDec = doc.getArray(`${a}-dec`);

			const backup = [];

			yjsArrayEnc.forEach((ii) => {
				const item = ii.toJSON();
				let exists = false;
				yjsArrayDec.forEach((oi) => {
					const otherItem = oi;
					if (otherItem.id === item.id) {
						exists = true;
					}

					return false;
				});

				const { id, ...rest } = item;

				backup.push({
					id: item.id,
					...decrypt(rest, key),
				});

				if (exists) {
					return;
				}

				yjsArrayDec.push([
					{
						id: item.id,
						...decrypt(rest, key),
					},
				]);

			});
				window.localStorage.setItem(
					`${a}-backup-backup`,
					JSON.stringify(backup),
				);
		}

		// useBindValtioToYjs(diaperChanges, doc.getArray('diaper-changes'));
		// useBindValtioToYjs(events, doc.getArray('events'));
		// useBindValtioToYjs(feedingSessions, doc.getArray('feeding-sessions'));
		// useBindValtioToYjs(growthMeasurements, doc.getArray('growth-measurments'));
		// useBindValtioToYjs(feedingInProgress, doc.getMap('feeding-in-progress'));
		// useBindValtioToYjs(medicationRegimensProxy, doc.getArray('medication-regimens'));
		// useBindValtioToYjs(medicationsProxy, doc.getArray('medications'));
	}, [key, isSynced]);

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
