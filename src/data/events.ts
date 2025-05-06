import { proxy } from 'valtio';
import { Event } from '@/types/event';
import { Encrypted } from '@/utils/crypto';

export const events = proxy([] as unknown as Encrypted<Event[]>);
