import type { Event } from '@/types/event';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useEvents = () => useArrayState<Event>(TABLE_IDS.EVENTS);
