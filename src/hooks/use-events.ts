import { events } from '@/data/events';
import { useArrayState } from './use-array-state';

export const useEvents = () => useArrayState(events, 'events-backup');
