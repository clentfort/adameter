import type { FeedingInProgress } from '@/types/feeding-in-progress';
import { useCallback, useMemo } from 'react';
import { useStore, useValue } from 'tinybase/ui-react';
import { setItem, STORAGE_KEYS } from '@/lib/storage';
import { STORE_VALUE_FEEDING_IN_PROGRESS } from '@/lib/tinybase-sync/constants';
import { feedingInProgressSchema } from '@/types/feeding-in-progress';

export const useFeedingInProgress = () => {
	const store = useStore()!;
	const currentJson = useValue(STORE_VALUE_FEEDING_IN_PROGRESS, store);
	const current = useMemo(
		() => parseFeedingInProgress(currentJson),
		[currentJson],
	);

	const set = useCallback(
		(nextFeedingInProgress: FeedingInProgress | null) => {
			if (nextFeedingInProgress === null) {
				store.delValue(STORE_VALUE_FEEDING_IN_PROGRESS);
				setItem(STORAGE_KEYS.FEEDING_IN_PROGRESS_BACKUP, 'null');
			} else {
				const normalized = structuredClone(nextFeedingInProgress);
				const json = JSON.stringify(normalized);
				store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, json);
				setItem(STORAGE_KEYS.FEEDING_IN_PROGRESS_BACKUP, json);
			}
		},
		[store],
	);

	return [current, set] as const;
};

export type UseFeedingInProgressType = typeof useFeedingInProgress;

function parseFeedingInProgress(value: unknown): FeedingInProgress | null {
	if (typeof value !== 'string' || value === '') {
		return null;
	}

	try {
		const parsed = JSON.parse(value);
		const result = feedingInProgressSchema.safeParse(parsed);

		if (!result.success) {
			// eslint-disable-next-line no-console
			console.warn('Invalid feeding in progress data:', result.error.issues);
			return null;
		}

		return result.data;
	} catch {
		return null;
	}
}
