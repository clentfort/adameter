import type { DiaperChange } from '@/types/diaper';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useDiaperChanges = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_CHANGES, store);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as DiaperChange,
			),
		[table],
	);

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

	return {
		add,
		remove,
		update,
		value,
	} as const;
};
