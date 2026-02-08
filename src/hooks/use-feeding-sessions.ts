import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useFeedingSessions = () =>
	useArrayState(TABLE_IDS.FEEDING_SESSIONS);
