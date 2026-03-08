import type { Row } from 'tinybase';
import type { Event } from '@/types/event';
import { useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeEventForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { createEntityHooks } from './create-entity-hooks';

function toEvent(id: string, row: Row): Event {
	return {
		...row,
		id,
	} as Event;
}

const eventHooks = createEntityHooks<Event>({
	sanitize: sanitizeEventForStore,
	tableId: TABLE_IDS.EVENTS,
	toEntity: toEvent,
});

export const useUpsertEvent = eventHooks.useUpsert;
export const useRemoveEvent = eventHooks.useRemove;
export const useEvent = eventHooks.useOne;
export const useEventsSnapshot = eventHooks.useSnapshot;
export const useEventIds = eventHooks.useIds;

export function useSortedEventIds() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.EVENTS, store);

	return useMemo(
		() =>
			Object.entries(table)
				.sort(([, a], [, b]) => {
					const aStart = typeof a.startDate === 'string' ? a.startDate : '';
					const bStart = typeof b.startDate === 'string' ? b.startDate : '';
					return bStart.localeCompare(aStart);
				})
				.map(([eventId]) => eventId),
		[table],
	);
}
