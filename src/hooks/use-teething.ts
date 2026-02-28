import type { Tooth } from '@/types/teething';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useTeething = () => {
	const store = useStore();
	const table = useTable(TABLE_IDS.TEETHING, store);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as Tooth,
			),
		[table],
	);

	const add = useCallback(
		(item: Tooth) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.TEETHING, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const update = useCallback(
		(item: Tooth) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.TEETHING, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.TEETHING, id);
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
