import type { Row } from 'tinybase';
import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { useMemo } from 'react';
import { useTable } from "tinybase/ui-react";
import { useTinybaseStore } from "@/hooks/use-tinybase-store";
import { } from '@/hooks/use-tinybase-store';
import { getFrecencySortedProductIds } from '@/app/diaper/utils/get-frecency-sorted-product-ids';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeDiaperProductForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { diaperProductSchema } from '@/types/diaper';
import { createEntityHooks } from './create-entity-hooks';

function toDiaperProduct(id: string, row: Row): DiaperProduct | null {
	const result = diaperProductSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		// eslint-disable-next-line no-console
		console.warn(
			`Invalid diaper product data for id ${id}:`,
			result.error.issues,
		);
		return null;
	}

	return result.data;
}

const diaperProductHooks = createEntityHooks<DiaperProduct>({
	sanitize: sanitizeDiaperProductForStore,
	tableId: TABLE_IDS.DIAPER_PRODUCTS,
	toEntity: toDiaperProduct,
});

export const useUpsertDiaperProduct = diaperProductHooks.useUpsert;
export const useRemoveDiaperProduct = diaperProductHooks.useRemove;
export const useDiaperProduct = diaperProductHooks.useOne;
export const useDiaperProductsSnapshot = diaperProductHooks.useSnapshot;
export const useDiaperProductIds = diaperProductHooks.useIds;

export function useSortedDiaperProductIds() {
	const store = useTinybaseStore();
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
	const store = useTinybaseStore();
	const table = useTable(TABLE_IDS.DIAPER_PRODUCTS, store);

	return useMemo(
		() => getFrecencySortedProductIds(table, changes),
		[changes, table],
	);
}
