import { atomWithStorage } from 'jotai/utils';
import { Event } from '@/types/event';

export const eventsAtom = atomWithStorage<Event[]>('events', [], undefined, {
	getOnInit: true,
});
