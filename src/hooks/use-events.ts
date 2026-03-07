import type { Row } from 'tinybase';
import type { Event } from '@/types/event';
import { useMemo } from 'react';
import {
	useDelRowCallback,
	useRow,
	useSetRowCallback,
	useStore,
	useTable,
} from 'tinybase/ui-react';
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
	return useSetRowCallback<Event>(
		TABLE_IDS.EVENTS,
		(event) => event.id,
		(event) => {
			const cells = sanitizeEventForStore(event);
			return cells ? { ...cells, deviceId: getDeviceId() } : {};
		},
		[],
	);
}

export function useRemoveEvent() {
	return useDelRowCallback<string>(TABLE_IDS.EVENTS, (id) => id);
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
