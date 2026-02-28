import type { Event } from '@/types/event';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useEvents = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.EVENTS, store);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as Event,
			),
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
