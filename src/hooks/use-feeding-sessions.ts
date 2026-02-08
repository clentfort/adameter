import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useTableArrayState } from './use-table-array-state';

export const useFeedingSessions = () =>
	useTableArrayState(TABLE_IDS.FEEDING_SESSIONS);
