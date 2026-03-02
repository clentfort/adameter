import type { Event } from '@/types/event';
import { useCallback, useMemo } from 'react';
import { useRow, useRowIds, useStore } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useEventRow = (id: string) => {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.EVENTS, id, store);
	return useMemo(() => ({ ...row, id }) as unknown as Event, [id, row]);
};

export const useAllEvents = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.EVENTS, store);

	return useMemo(
		() =>
			rowIds.map(
				(id) => ({ ...store.getRow(TABLE_IDS.EVENTS, id), id }) as unknown as Event,
			),
		[rowIds, store],
	);
};

export const useEvents = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.EVENTS, store);

	const add = useCallback(
		(item: Event) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.EVENTS, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const update = useCallback(
		(item: Event) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.EVENTS, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.EVENTS, id);
		},
		[store],
	);

	return {
		add,
		remove,
		rowIds,
		update,
	} as const;
};
