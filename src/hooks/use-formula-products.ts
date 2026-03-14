import type { Row } from 'tinybase';
import type { FormulaProduct } from '@/types/feeding-products';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeFormulaProductForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { formulaProductSchema } from '@/types/feeding-products';
import { createEntityHooks } from './create-entity-hooks';

function toFormulaProduct(id: string, row: Row): FormulaProduct | null {
	const result = formulaProductSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		// eslint-disable-next-line no-console
		console.warn(
			`Invalid formula product data for id ${id}:`,
			result.error.issues,
		);
		return null;
	}

	return result.data;
}

const formulaProductHooks = createEntityHooks<FormulaProduct>({
	sanitize: sanitizeFormulaProductForStore,
	tableId: TABLE_IDS.FORMULA_PRODUCTS,
	toEntity: toFormulaProduct,
});

export const useUpsertFormulaProduct = formulaProductHooks.useUpsert;
export const useRemoveFormulaProduct = formulaProductHooks.useRemove;
export const useFormulaProduct = formulaProductHooks.useOne;
export const useFormulaProductsSnapshot = formulaProductHooks.useSnapshot;
export const useFormulaProductIds = formulaProductHooks.useIds;

export const useSortedFormulaProductIds = () => {
	const ids = useFormulaProductIds();
	const snapshot = useFormulaProductsSnapshot();

	return ids.sort((a, b) => {
		const productA = snapshot.find((p) => p.id === a);
		const productB = snapshot.find((p) => p.id === b);
		if (!productA || !productB) return 0;
		return productA.name.localeCompare(productB.name);
	});
};
