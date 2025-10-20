import { proxy } from 'valtio';
import { Event } from '@/types/event';

export const events = proxy<Event[]>([]);
