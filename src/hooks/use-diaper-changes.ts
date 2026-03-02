import type { DiaperChange } from '@/types/diaper';
import { useCallback, useMemo } from 'react';
import {
	useResultTable,
	useRow,
	useRowIds,
	useStore,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useDiaperChangeRow = (id: string) => {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.DIAPER_CHANGES, id, store);
	return useMemo(() => ({ ...row, id }) as unknown as DiaperChange, [id, row]);
};

export const useAllDiaperChanges = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.DIAPER_CHANGES, store);

	return useMemo(
		() =>
			rowIds.map(
				(id) =>
					({
						...store.getRow(TABLE_IDS.DIAPER_CHANGES, id),
						id,
					}) as DiaperChange,
			),
		[rowIds, store],
	);
};

export const useDiaperChanges = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.DIAPER_CHANGES, store);

	const add = useCallback(
		(item: DiaperChange) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.DIAPER_CHANGES, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const update = useCallback(
		(item: DiaperChange) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.DIAPER_CHANGES, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.DIAPER_CHANGES, id);
		},
		[store],
	);

	const historyTable = useResultTable('diaperHistory');
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
