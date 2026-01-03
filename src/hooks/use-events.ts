import { Event } from '@/types/event';
import { useArrayState } from './use-array-state';

export const useEvents = () => useArrayState<Event>('events');
