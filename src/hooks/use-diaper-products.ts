import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { fromTable } from '@/lib/tinybase-sync/migration-utils';
import { DiaperProduct } from '@/types/diaper';
import { getDeviceId } from '@/utils/device-id';

export const useDiaperProducts = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_PRODUCTS, store);

	const value = useMemo(() => {
		const products = fromTable<DiaperProduct>(table);
		return products.map((product) => ({
			...product,
			costPerDiaper:
				typeof product.costPerDiaper === 'string'
					? Number.parseFloat(product.costPerDiaper)
					: product.costPerDiaper,
			upfrontCost:
				typeof product.upfrontCost === 'string'
					? Number.parseFloat(product.upfrontCost)
					: product.upfrontCost,
		}));
	}, [table]);

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
		update,
		value,
	} as const;
};
