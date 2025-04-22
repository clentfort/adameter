import { useAtom } from 'jotai/react';
import { feedingInProgress } from '@/data/feeding-in-progress-atom';

export const useFeedingInProgress = () => useAtom(feedingInProgress);
