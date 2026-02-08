import type { FeedingInProgress } from '@/types/feeding-in-progress';
import { useCallback, useContext } from 'react';
import { useValue } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { STORE_VALUE_FEEDING_IN_PROGRESS } from '@/lib/tinybase-sync/constants';

export const useFeedingInProgress = () => {
	const { store } = useContext(tinybaseContext);
	const currentJson = useValue(STORE_VALUE_FEEDING_IN_PROGRESS, store);
	const current = parseFeedingInProgress(currentJson);

	const set = useCallback(
		(nextFeedingInProgress: FeedingInProgress | null) => {
			if (nextFeedingInProgress === null) {
				store.delValue(STORE_VALUE_FEEDING_IN_PROGRESS);

				localStorage.setItem('feedingInProgress-backup', 'null');
				return;
			}

			const normalized = structuredClone(nextFeedingInProgress);
			store.setValue(
				STORE_VALUE_FEEDING_IN_PROGRESS,
				JSON.stringify(normalized),
			);

			localStorage.setItem(
				'feedingInProgress-backup',
				JSON.stringify(normalized),
			);
		},
		[store],
	);

	return [current, set] as const;
};

export type UseFeedingInProgressType = typeof useFeedingInProgress;

function parseFeedingInProgress(value: unknown): FeedingInProgress | null {
	if (typeof value !== 'string') {
		return null;
	}

	try {
		return JSON.parse(value) as FeedingInProgress;
	} catch {
		return null;
	}
}
