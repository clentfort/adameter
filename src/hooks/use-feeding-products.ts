import type { Row } from 'tinybase';
import type { FeedingProduct } from '@/types/feeding-products';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeFeedingProductForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { feedingProductSchema } from '@/types/feeding-products';
import { createEntityHooks } from './create-entity-hooks';

function toFeedingProduct(id: string, row: Row): FeedingProduct | null {
	const result = feedingProductSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		// eslint-disable-next-line no-console
		console.warn(
			`Invalid feeding product data for id ${id}:`,
			result.error.issues,
		);
		return null;
	}

	return result.data;
}

const feedingProductHooks = createEntityHooks<FeedingProduct>({
	sanitize: sanitizeFeedingProductForStore,
	tableId: TABLE_IDS.FEEDING_PRODUCTS,
	toEntity: toFeedingProduct,
});

export const useUpsertFeedingProduct = feedingProductHooks.useUpsert;
export const useRemoveFeedingProduct = feedingProductHooks.useRemove;
export const useFeedingProduct = feedingProductHooks.useOne;
export const useFeedingProductsSnapshot = feedingProductHooks.useSnapshot;
export const useFeedingProductIds = feedingProductHooks.useIds;

export const useSortedFeedingProductIds = (type?: 'bottle') => {
	const ids = useFeedingProductIds();
	const snapshot = useFeedingProductsSnapshot();

	return ids
		.filter((id) => {
			if (!type) return true;
			const product = snapshot.find((p) => p.id === id);
			return product?.type === type;
		})
		.sort((a, b) => {
			const productA = snapshot.find((p) => p.id === a);
			const productB = snapshot.find((p) => p.id === b);
			if (!productA || !productB) return 0;
			return productA.name.localeCompare(productB.name);
		});
};
