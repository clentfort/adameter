'use client';

import type { MergeableStore } from 'tinybase';
import type { Persister } from 'tinybase/persisters';
import { useContext, useEffect, useRef, useState } from 'react';
import { createMergeableStore } from 'tinybase';
import { createIndexedDbPersister } from 'tinybase/persisters/persister-indexed-db';
import { Provider } from 'tinybase/ui-react';
import { SplashScreen } from '@/components/splash-screen';
import { logger } from '@/lib/logger';
import { resolvePartykitHost } from '@/lib/partykit-host';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { cloneRoomData } from '@/lib/tinybase-sync/cloning';
import {
	STORE_VALUE_SELECTED_PROFILE_ID,
	TINYBASE_LOCAL_DB_NAME,
} from '@/lib/tinybase-sync/constants';
import { startRoomSync } from '@/lib/tinybase-sync/room-sync';
import { isStoreDataEmpty } from '@/lib/tinybase-sync/store-utils';
import { repairMissingProfileIds } from '@/migrations/2026-06-05-consolidate-duplicate-profiles';
import { runMigrationsIfNeeded } from '@/migrations/run-if-needed';
import { getDeviceId } from '@/utils/device-id';
import { DataSynchronizationContext } from './data-synchronization-context';

const defaultStore = createMergeableStore();

interface TinybaseProviderProps {
	children: React.ReactNode;
}

async function clonePreviewDataIfEmpty(
	store: MergeableStore,
	persister: Persister,
): Promise<void> {
	if (
		process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' &&
		process.env.NEXT_PUBLIC_MAIN_ROOM_NAME &&
		isStoreDataEmpty(store)
	) {
		try {
			await cloneRoomData(
				process.env.NEXT_PUBLIC_MAIN_ROOM_NAME,
				resolvePartykitHost({ vercelEnv: 'production' }),
				store,
			);
			await persister.save();
			logger.log('Auto-cloned data from production in preview environment');
		} catch (error) {
			logger.error('Failed to auto-clone data from production:', error);
		}
	}
}

export function TinybaseProvider({ children }: TinybaseProviderProps) {
	const { isHydrated, joinStrategy, resetJoinStrategy, room } = useContext(
		DataSynchronizationContext,
	);
	const joinStrategyRef = useRef(joinStrategy);
	joinStrategyRef.current = joinStrategy;
	const storeRef = useRef<MergeableStore>(defaultStore);
	const [isLocalReady, setIsLocalReady] = useState(false);
	const [isSyncReady, setIsSyncReady] = useState(false);

	useEffect(() => {
		let isDisposed = false;

		const store = storeRef.current;
		const localPersister = createIndexedDbPersister(
			store,
			TINYBASE_LOCAL_DB_NAME,
		);

		const initialize = async () => {
			const startLoad = performance.now();
			await localPersister.load();
			logger.log(
				`[PERF] Local IndexedDB load took ${(performance.now() - startLoad).toFixed(2)}ms`,
			);

			await clonePreviewDataIfEmpty(store, localPersister);

			await localPersister.startAutoSave();

			const localSelectedProfileId = store.getValue(
				STORE_VALUE_SELECTED_PROFILE_ID,
			);
			if (
				typeof localSelectedProfileId === 'string' &&
				!getItem(STORAGE_KEYS.SELECTED_PROFILE_ID)
			) {
				setItem(STORAGE_KEYS.SELECTED_PROFILE_ID, localSelectedProfileId);
			}

			const startMigrations = performance.now();
			await runMigrationsIfNeeded(store, { deviceId: getDeviceId() });
			repairMissingProfileIds(store);
			logger.log(
				`[PERF] Initial local migrations took ${(performance.now() - startMigrations).toFixed(2)}ms`,
			);

			if (!isDisposed) {
				setIsLocalReady(true);
			}
		};

		void initialize().catch(() => {
			if (!isDisposed) {
				setIsLocalReady(true);
			}
		});

		return () => {
			isDisposed = true;
			void localPersister.stopAutoSave();
			void localPersister.destroy();
		};
	}, []);

	useEffect(() => {
		if (!isHydrated || !isLocalReady) {
			return;
		}

		if (!room) {
			setIsSyncReady(true);
			return;
		}

		setIsSyncReady(false);

		return startRoomSync({
			joinStrategy: joinStrategyRef.current,
			onJoinStrategyApplied: resetJoinStrategy,
			onReady: () => setIsSyncReady(true),
			room,
			store: storeRef.current,
		});
	}, [isHydrated, isLocalReady, resetJoinStrategy, room]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const isDevelopment = process.env.NODE_ENV === 'development';
			const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
			const isTest = (window as unknown as { __E2E_TESTS__?: boolean })
				.__E2E_TESTS__;

			if (isDevelopment || isPreview || isTest) {
				Object.assign(window, {
					tinybaseLocalReady: isLocalReady,
					tinybaseStore: storeRef.current,
				});
			}
		}
	}, [isLocalReady]);

	if (!isHydrated || !isLocalReady || !isSyncReady) {
		return <SplashScreen />;
	}

	return <Provider store={storeRef.current}>{children}</Provider>;
}
