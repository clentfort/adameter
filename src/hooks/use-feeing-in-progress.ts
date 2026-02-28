import type { FeedingInProgress } from '@/types/feeding-in-progress';
import { useCallback, useMemo } from 'react';
import { useStore, useValue } from 'tinybase/ui-react';
import { STORE_VALUE_FEEDING_IN_PROGRESS } from '@/lib/tinybase-sync/constants';

export const useFeedingInProgress = () => {
	const store = useStore();
	const currentJson = useValue(STORE_VALUE_FEEDING_IN_PROGRESS, store);
	const current = useMemo(
		() => parseFeedingInProgress(currentJson),
		[currentJson],
	);

	const set = useCallback(
		(nextFeedingInProgress: FeedingInProgress | null) => {
			if (nextFeedingInProgress === null) {
				store.delValue(STORE_VALUE_FEEDING_IN_PROGRESS);
				localStorage.setItem('feedingInProgress-backup', 'null');
			} else {
				const normalized = structuredClone(nextFeedingInProgress);
				const json = JSON.stringify(normalized);
				store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, json);
				localStorage.setItem('feedingInProgress-backup', json);
			}
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
