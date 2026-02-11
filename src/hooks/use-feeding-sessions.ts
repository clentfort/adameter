import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import type { FeedingSession } from '@/types/feeding';
import { useArrayState } from './use-array-state';

export const useFeedingSessions = () =>
	useArrayState<FeedingSession>(TABLE_IDS.FEEDING_SESSIONS);
