import type { Row } from 'tinybase';
import type { DiaperPurchase } from '@/types/diaper';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeDiaperPurchaseForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { diaperPurchaseSchema } from '@/types/diaper';
import { createEntityHooks } from './create-entity-hooks';

function toDiaperPurchase(id: string, row: Row): DiaperPurchase | null {
	const result = diaperPurchaseSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		// eslint-disable-next-line no-console
		console.warn(
			`Invalid diaper purchase data for id ${id}:`,
			result.error.issues,
		);
		return null;
	}

	return result.data;
}

const diaperPurchaseHooks = createEntityHooks<DiaperPurchase>({
	sanitize: (purchase) =>
		sanitizeDiaperPurchaseForStore(purchase as unknown as Record<string, unknown>),
	tableId: TABLE_IDS.DIAPER_PURCHASES,
	toEntity: toDiaperPurchase,
});

export const useUpsertDiaperPurchase = diaperPurchaseHooks.useUpsert;
export const useRemoveDiaperPurchase = diaperPurchaseHooks.useRemove;
export const useDiaperPurchase = diaperPurchaseHooks.useOne;
export const useDiaperPurchasesSnapshot = diaperPurchaseHooks.useSnapshot;
export const useDiaperPurchaseIds = diaperPurchaseHooks.useIds;
