import type { FeedingSession } from '@/types/feeding';
import { useCallback, useMemo } from 'react';
import {
	useResultTable,
	useRow,
	useRowIds,
	useStore,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useFeedingSessionRow = (id: string) => {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.FEEDING_SESSIONS, id, store);
	return useMemo(() => ({ ...row, id }) as unknown as FeedingSession, [id, row]);
};

export const useFeedingSessions = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.FEEDING_SESSIONS, store);

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

	const historyTable = useResultTable('feedingHistory');
	const historyRowIds = useMemo(
		() => Object.keys(historyTable),
		[historyTable],
	);

	return {
		add,
		historyRowIds,
		remove,
		rowIds,
		update,
	} as const;
};
