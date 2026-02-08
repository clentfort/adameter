import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useEvents = () => useArrayState(TABLE_IDS.EVENTS);
