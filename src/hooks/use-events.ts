import type { Event } from '@/types/event';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeEventForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { useTinybaseEntityTable } from './use-tinybase-entity-table';

export const useEvents = () =>
	useTinybaseEntityTable<Event>(TABLE_IDS.EVENTS, sanitizeEventForStore);
