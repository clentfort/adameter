import { useCallback } from 'react';
import { useStore, useValue } from 'tinybase/ui-react';
import { FeedingInProgress } from '@/types/feeding-in-progress';

export const useFeedingInProgress = () => {
  const store = useStore();
  const value = useValue('feeding-in-progress');
  const current = JSON.parse((value as string | null) ?? 'null');
  const set = useCallback(
    (nextFeedingInProgress: FeedingInProgress | null) => {
      if (!store) {
        return;
      }

      store.setValue(
        'feeding-in-progress',
        JSON.stringify(nextFeedingInProgress),
      );
    },
    [store],
  );

  return [current, set] as const;
};

export type UseFeedingInProgressType = typeof useFeedingInProgress;
