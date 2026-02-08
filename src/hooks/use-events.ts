import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useTableArrayState } from './use-table-array-state';

export const useEvents = () => useTableArrayState(TABLE_IDS.EVENTS);
