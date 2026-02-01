'use client';

import { createContext, useCallback, useEffect, useState } from 'react';
import { bind } from 'valtio-yjs';
import { IndexeddbPersistence, storeState } from 'y-indexeddb';
import * as Yjs from 'yjs';
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
	doc: Yjs.Doc;
	epoch: number;
	forceNewEpoch: () => void;
	isNetworkSynced: boolean;
	setNetworkSynced: (synced: boolean) => void;
}>({
	doc: new Yjs.Doc(),
	epoch: 1,
	forceNewEpoch: () => {},
	isNetworkSynced: false,
	setNetworkSynced: () => {},
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
	const [doc, setDoc] = useState(() => new Yjs.Doc());
	const [isNetworkSynced, setNetworkSynced] = useState(false);

	const handleMigration = useCallback((newEpoch: number) => {
		localStorage.setItem(EPOCH_KEY, newEpoch.toString());
		setEpoch(newEpoch);
		setDoc(new Yjs.Doc());
		setNetworkSynced(false);
	}, []);

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
		const size = Yjs.encodeStateAsUpdate(doc).length;
		if (size > COMPACTION_THRESHOLD) {
			const newEpoch = epoch + 1;
			doc
				.getMap('meta')
				.set('migratedTo', { epoch: newEpoch, seederId: clientId });
			handleMigration(newEpoch);
		}
	}, [doc, epoch, handleMigration, clientId]);

	const forceNewEpoch = useCallback(() => {
		const newEpoch = epoch + 1;
		doc
			.getMap('meta')
			.set('migratedTo', { epoch: newEpoch, seederId: clientId });
		handleMigration(newEpoch);
	}, [doc, epoch, handleMigration, clientId]);

	const isSynced = useYjsPersistence(doc, epoch, onSynced);

	useBindValtioToYjs(
		diaperChanges,
		doc.getArray('diaper-changes-dec'),
		isSynced,
		isNetworkSynced,
	);
	useBindValtioToYjs(
		events,
		doc.getArray('events-dec'),
		isSynced,
		isNetworkSynced,
	);
	useBindValtioToYjs(
		feedingSessions,
		doc.getArray('feeding-sessions-dec'),
		isSynced,
		isNetworkSynced,
	);
	useBindValtioToYjs(
		growthMeasurements,
		doc.getArray('growth-measurments-dec'),
		isSynced,
		isNetworkSynced,
	);
	useBindValtioToYjs(
		feedingInProgress,
		doc.getMap('feeding-in-progress-dec'),
		isSynced,
		isNetworkSynced,
	);
	useBindValtioToYjs(
		medicationRegimensProxy,
		doc.getArray('medication-regimens-dec'),
		isSynced,
		isNetworkSynced,
	);
	useBindValtioToYjs(
		medicationsProxy,
		doc.getArray('medications-dec'),
		isSynced,
		isNetworkSynced,
	);

	if (!isSynced) {
		return <SplashScreen />;
	}

	return (
		<yjsContext.Provider
			value={{
				doc,
				epoch,
				forceNewEpoch,
				isNetworkSynced,
				setNetworkSynced,
			}}
		>
			{children}
		</yjsContext.Provider>
	);
}

function useBindValtioToYjs<T>(
	state: T[],
	yType: Yjs.Array<T>,
	isSynced: boolean,
	isNetworkSynced: boolean,
): void;
function useBindValtioToYjs<T>(
	state: Record<string, T>,
	yType: Yjs.Map<T>,
	isSynced: boolean,
	isNetworkSynced: boolean,
): void;
function useBindValtioToYjs<T>(
	state: Record<string, T> | T[],
	yType: Yjs.Map<T> | Yjs.Array<T>,
	isSynced: boolean,
	isNetworkSynced: boolean,
) {
	const [hasBound, setHasBound] = useState(false);

	useEffect(() => {
		if (!isSynced) {
			setHasBound(false);
			return;
		}

		// To prevent duplication during migration, we wait for either the network
		// to sync or a short timeout before binding. This ensures we don't push
		// local data that might already be in the new epoch room.
		const timeout = setTimeout(
			() => {
				if (!hasBound) {
					setHasBound(true);
				}
			},
			isNetworkSynced ? 0 : 2000,
		);

		return () => clearTimeout(timeout);
	}, [isSynced, isNetworkSynced, hasBound]);

	useEffect(() => {
		if (!hasBound) {
			return;
		}

		if (yType instanceof Yjs.Array && Array.isArray(state)) {
			// Smart Merge: Remove items from Valtio that are already in Yjs to prevent duplication
			const yData = yType.toArray();
			const yIds = new Set(yData.map((item: any) => item.id));

			for (let i = state.length - 1; i >= 0; i--) {
				if (yIds.has((state[i] as any).id)) {
					state.splice(i, 1);
				}
			}
		}

		const unbind = bind(state, yType as any);
		return () => {
			unbind();
		};
	}, [state, yType, hasBound]);
}

function useYjsPersistence(
	doc: Yjs.Doc,
	epoch: number,
	onSynced?: () => void,
) {
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
