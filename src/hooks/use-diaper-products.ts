import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { getFrecencySortedProductIds } from '@/app/diaper/utils/get-frecency-sorted-product-ids';
import { useDiaperChangesSnapshot } from '@/hooks/use-diaper-changes';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeDiaperProductForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { diaperProductSchema } from '@/types/diaper';
import { createEntityHooks, createRowParser } from './create-entity-hooks';

const toDiaperProduct = createRowParser(diaperProductSchema, 'diaper product');

const diaperProductHooks = createEntityHooks<DiaperProduct>({
	sanitize: sanitizeDiaperProductForStore,
	tableId: TABLE_IDS.DIAPER_PRODUCTS,
	toEntity: toDiaperProduct,
});

export const useUpsertDiaperProduct = diaperProductHooks.useUpsert;
export const useRemoveDiaperProduct = diaperProductHooks.useRemove;
export const useDiaperProduct = diaperProductHooks.useOne;
export const useDiaperProductsSnapshot = diaperProductHooks.useSnapshot;

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

export function useFrecencySortedDiaperProductIds(
	changesParam?: DiaperChange[],
) {
	const snapshotChanges = useDiaperChangesSnapshot();
	const changes = changesParam ?? snapshotChanges;
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_PRODUCTS, store);

	return useMemo(
		() => getFrecencySortedProductIds(table, changes),
		[changes, table],
	);
}
