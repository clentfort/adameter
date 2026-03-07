import type { Row } from 'tinybase';
import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { useMemo } from 'react';
import {
	useDelRowCallback,
	useRow,
	useSetRowCallback,
	useStore,
	useTable,
} from 'tinybase/ui-react';
import { getFrecencySortedProductIds } from '@/app/diaper/utils/get-frecency-sorted-product-ids';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeDiaperProductForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { getDeviceId } from '@/utils/device-id';

function toDiaperProduct(id: string, row: Row): DiaperProduct {
	return {
		...row,
		id,
	} as DiaperProduct;
}

export function useUpsertDiaperProduct() {
	return useSetRowCallback<DiaperProduct>(
		TABLE_IDS.DIAPER_PRODUCTS,
		(product) => product.id,
		(product) => {
			const cells = sanitizeDiaperProductForStore(product);
			return cells ? { ...cells, deviceId: getDeviceId() } : {};
		},
		[],
	);
}

export function useRemoveDiaperProduct() {
	return useDelRowCallback<string>(TABLE_IDS.DIAPER_PRODUCTS, (id) => id);
}

export function useDiaperProduct(productId: string | undefined) {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.DIAPER_PRODUCTS, productId ?? '', store);

	return useMemo(() => {
		if (!productId || Object.keys(row).length === 0) {
			return undefined;
		}

		return toDiaperProduct(productId, row);
	}, [productId, row]);
}

export function useSortedDiaperProductIds() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_PRODUCTS, store);

	return useMemo(
		() =>
			Object.entries(table)
				.sort(([, a], [, b]) => {
					const aArchived = a.archived === true;
					const bArchived = b.archived === true;

					if (aArchived && !bArchived) return 1;
					if (!aArchived && bArchived) return -1;

					const aName = typeof a.name === 'string' ? a.name : '';
					const bName = typeof b.name === 'string' ? b.name : '';
					return aName.localeCompare(bName);
				})
				.map(([productId]) => productId),
		[table],
	);
}

export function useFrecencySortedDiaperProductIds(changes: DiaperChange[]) {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_PRODUCTS, store);

	return useMemo(
		() => getFrecencySortedProductIds(table, changes),
		[changes, table],
	);
}

export function useDiaperProductsSnapshot() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_PRODUCTS, store);

	return useMemo(
		() =>
			Object.entries(table).map(([productId, row]) =>
				toDiaperProduct(productId, row),
			),
		[table],
	);
}
