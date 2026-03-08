import type { Row } from 'tinybase';
import type { Event } from '@/types/event';
import { useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeEventForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { eventSchema } from '@/types/event';
import { createEntityHooks } from './create-entity-hooks';

function toEvent(id: string, row: Row): Event | null {
	const result = eventSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		console.warn(`Invalid event data for id ${id}:`, result.error.issues);
		return null;
	}

	return result.data;
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
				.map(([id, row]) => ({ id, entity: toEvent(id, row) }))
				.filter(
					(item): item is { id: string; entity: Event } => item.entity !== null,
				)
				.sort((a, b) => {
					return b.entity.startDate.localeCompare(a.entity.startDate);
				})
				.map((item) => item.id),
		[table],
	);
}
