'use client';

import type { Store } from 'tinybase';
import PartySocket from 'partysocket';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createStore } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { createPartyKitPersister } from 'tinybase/persisters/persister-partykit-client';
import { Provider } from 'tinybase/ui-react';
import { migrateDiaperBrandsToProducts } from '@/app/diaper/utils/migration';
import { SplashScreen } from '@/components/splash-screen';
import { PARTYKIT_HOST } from '@/lib/partykit-host';
import { migrateToJsonCells } from '@/lib/tinybase-sync/cell-migration';
import {
	TINYBASE_LOCAL_DB_NAME,
	TINYBASE_PARTYKIT_PARTY,
} from '@/lib/tinybase-sync/constants';
import {
	reconcileRemoteLoadResult,
	snapshotStoreContentIfNonEmpty,
} from '@/lib/tinybase-sync/remote-bootstrap';
import { getDeviceId } from '@/utils/device-id';
import { DataSynchronizationContext } from './data-synchronization-context';

const defaultStore = createStore();

export const tinybaseContext = createContext<{ store: Store }>({
	store: defaultStore,
});

interface TinybaseProviderProps {
	children: React.ReactNode;
}

export function TinybaseProvider({ children }: TinybaseProviderProps) {
	const { joinStrategy, room } = useContext(DataSynchronizationContext);
	const storeRef = useRef<Store>(defaultStore);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		let isDisposed = false;

		const store = storeRef.current;
		const localPersister = createIndexedDbPersister(
			store,
			TINYBASE_LOCAL_DB_NAME,
		);

		const initialize = async () => {
			await localPersister.load();

			await localPersister.startAutoSave();

			migrateToJsonCells(store);
			migrateDiaperBrandsToProducts(store);

			if (!isDisposed) {
				setIsReady(true);
			}
		};

		void initialize().catch((_error) => {
			if (!isDisposed) {
				setIsReady(true);
			}
		});

		return () => {
			isDisposed = true;
			void localPersister.stopAutoSave();
			void localPersister.destroy();
		};
	}, []);

	useEffect(() => {
		if (!isReady || !room) {
			return;
		}

		let isDisposed = false;
		const store = storeRef.current;
		let remotePersister: ReturnType<typeof createPartyKitPersister> | undefined;
		let connection: PartySocket | undefined;

		const onOpen = () => {
			void remotePersister?.load();
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				connection?.reconnect();
				void remotePersister?.load();
			}
		};

		const connectRoomSync = async () => {
			if (isDisposed) {
				return;
			}

			connection = new PartySocket({
				host: PARTYKIT_HOST,
				party: TINYBASE_PARTYKIT_PARTY,
				room,
			});
			connection.addEventListener('open', onOpen);
			document.addEventListener('visibilitychange', onVisibilityChange);
			window.addEventListener('focus', onVisibilityChange);

			remotePersister = createPartyKitPersister(
				store,
				connection,
				undefined,
				(_error) => {},
			);

			const localSnapshot = snapshotStoreContentIfNonEmpty(store);
			await remotePersister.load();
			const bootstrapResult = reconcileRemoteLoadResult(
				store,
				localSnapshot,
				joinStrategy,
				getDeviceId(),
			);

			migrateToJsonCells(store);
			migrateDiaperBrandsToProducts(store);

			if (
				bootstrapResult.decision === 'restore-local' ||
				bootstrapResult.decision === 'keep-empty' ||
				bootstrapResult.decision === 'merge'
			) {
				await remotePersister.save();
			}

			await remotePersister.startAutoPersisting(undefined, false);
		};

		void connectRoomSync().catch((_error) => {});

		return () => {
			isDisposed = true;
			connection?.removeEventListener('open', onOpen);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('focus', onVisibilityChange);

			if (!remotePersister) {
				return;
			}

			void remotePersister.stopAutoPersisting(true);
			void remotePersister.destroy();
		};
	}, [isReady, room, joinStrategy]);

	if (!isReady) {
		return <SplashScreen />;
	}

	return (
		<tinybaseContext.Provider value={{ store: storeRef.current }}>
			<Provider store={storeRef.current}>{children}</Provider>
		</tinybaseContext.Provider>
	);
}
