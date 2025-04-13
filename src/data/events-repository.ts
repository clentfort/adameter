import { Event } from '@/types/event';
import { Repository } from './repository';

export const eventsRepository = new Repository<Event>('events');
