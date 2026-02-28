import type { Event } from '@/types/event';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { fromTable } from '@/lib/tinybase-sync/migration-utils';
import { getDeviceId } from '@/utils/device-id';

export const useEvents = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.EVENTS, store);

	const value = useMemo(
		() => fromTable<Event>(table),
		[table],
	);

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
		update,
		value,
	} as const;
};
