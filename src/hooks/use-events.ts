import type { Row } from 'tinybase';
import type { Event } from '@/types/event';
import { useCallback, useMemo } from 'react';
import { useRow, useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeEventForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { getDeviceId } from '@/utils/device-id';

function toEvent(id: string, row: Row): Event {
	return {
		...row,
		id,
	} as Event;
}

export function useUpsertEvent() {
	const store = useStore()!;

	return useCallback(
		(event: Event) => {
			const cells = sanitizeEventForStore(event);
			if (!cells) {
				return;
			}

			store.setRow(TABLE_IDS.EVENTS, event.id, {
				...cells,
				deviceId: getDeviceId(),
			});
		},
		[store],
	);
}

export function useRemoveEvent() {
	const store = useStore()!;

	return useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.EVENTS, id);
		},
		[store],
	);
}

export function useEvent(eventId: string | undefined) {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.EVENTS, eventId ?? '', store);

	return useMemo(() => {
		if (!eventId || Object.keys(row).length === 0) {
			return undefined;
		}

		return toEvent(eventId, row);
	}, [eventId, row]);
}

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

export function useEventsSnapshot() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.EVENTS, store);

	return useMemo(
		() => Object.entries(table).map(([eventId, row]) => toEvent(eventId, row)),
		[table],
	);
}
