import type { FeedingInProgress } from '@/types/feeding-in-progress';
import { useMemo } from 'react';
import { useDelValueCallback, useSetValueCallback, useValue } from 'tinybase/ui-react';
import { STORE_VALUE_FEEDING_IN_PROGRESS } from '@/lib/tinybase-sync/constants';

export const useFeedingInProgress = () => {
	const currentJson = useValue(STORE_VALUE_FEEDING_IN_PROGRESS);
	const current = useMemo(
		() => parseFeedingInProgress(currentJson),
		[currentJson],
	);

	const setValue = useSetValueCallback(
		STORE_VALUE_FEEDING_IN_PROGRESS,
		(nextFeedingInProgress: FeedingInProgress) => {
			const normalized = structuredClone(nextFeedingInProgress);
			const json = JSON.stringify(normalized);
			localStorage.setItem('feedingInProgress-backup', json);
			return json;
		},
		[],
	);

	const delValue = useDelValueCallback(STORE_VALUE_FEEDING_IN_PROGRESS, () => {
		localStorage.setItem('feedingInProgress-backup', 'null');
	});

	const set = (nextFeedingInProgress: FeedingInProgress | null) => {
		if (nextFeedingInProgress === null) {
			delValue();
		} else {
			setValue(nextFeedingInProgress);
		}
	};

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
