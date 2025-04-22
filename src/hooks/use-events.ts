import { eventsAtom } from '@/data/events-atom';
import { useArrayAtom } from './use-array-atom';

export const useEvents = () => useArrayAtom(eventsAtom);
