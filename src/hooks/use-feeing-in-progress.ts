import { feedingInProgress } from '@/data/feeding-in-progress-atom';
import { useClientOnlyAtom } from './use-client-only-atom';

export const useFeedingInProgress = () => useClientOnlyAtom(feedingInProgress);
