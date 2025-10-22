import { useCallback } from 'react';
import { useSnapshot } from 'valtio';
import { feedingInProgress } from '@/data/feeding-in-progress';
import { FeedingInProgress } from '@/types/feeding-in-progress';

export const useFeedingInProgress = () => {
	const current = useSnapshot(feedingInProgress).current as FeedingInProgress | null;
	const set = useCallback(
		(nextFeedingInProgress: FeedingInProgress | null) => {
			feedingInProgress.current = nextFeedingInProgress;
			localStorage.setItem(
				'feedingInProgress-backup',
				JSON.stringify(nextFeedingInProgress),
			);
		},
		[],
	);
	return [current, set] as const;
};

export type UseFeedingInProgressType = typeof useFeedingInProgress;