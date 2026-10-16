import type { Event } from '@/types/event';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeEventForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { eventSchema } from '@/types/event';
import { createEntityHooks, createRowParser } from './create-entity-hooks';

const toEvent = createRowParser(eventSchema, 'event');

const eventHooks = createEntityHooks<Event>({
	sanitize: sanitizeEventForStore,
	tableId: TABLE_IDS.EVENTS,
	toEntity: toEvent,
});

export const useUpsertEvent = eventHooks.useUpsert;
export const useRemoveEvent = eventHooks.useRemove;
export const useEvent = eventHooks.useOne;
export const useEventsSnapshot = eventHooks.useSnapshot;
