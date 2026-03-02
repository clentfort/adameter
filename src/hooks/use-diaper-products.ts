import { useCallback, useMemo } from 'react';
import { useRow, useRowIds, useStore } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { DiaperProduct } from '@/types/diaper';
import { getDeviceId } from '@/utils/device-id';

export const useDiaperProductRow = (id: string) => {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.DIAPER_PRODUCTS, id, store);
	return useMemo(() => ({ ...row, id }) as unknown as DiaperProduct, [id, row]);
};

export const useAllDiaperProducts = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.DIAPER_PRODUCTS, store);

	return useMemo(
		() =>
			rowIds.map(
				(id) =>
					({
						...store.getRow(TABLE_IDS.DIAPER_PRODUCTS, id),
						id,
					}) as DiaperProduct,
			),
		[rowIds, store],
	);
};

export const useDiaperProducts = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.DIAPER_PRODUCTS, store);

	const add = useCallback(
		(item: DiaperProduct) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const update = useCallback(
		(item: DiaperProduct) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.DIAPER_PRODUCTS, id);
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
