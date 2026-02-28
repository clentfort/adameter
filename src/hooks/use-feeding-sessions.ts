import type { FeedingSession } from '@/types/feeding';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useFeedingSessions = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.FEEDING_SESSIONS, store);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as FeedingSession,
			),
		[table],
	);

	const add = useCallback(
		(item: FeedingSession) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const update = useCallback(
		(item: FeedingSession) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.FEEDING_SESSIONS, id);
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
