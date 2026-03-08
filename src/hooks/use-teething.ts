import type { Row } from 'tinybase';
import type { Tooth } from '@/types/teething';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeToothForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { toothSchema } from '@/types/teething';
import { createEntityHooks } from './create-entity-hooks';

function toTooth(id: string, row: Row): Tooth | null {
	const result = toothSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		console.warn(`Invalid tooth data for id ${id}:`, result.error.issues);
		return null;
	}

	return result.data;
}

const teethingHooks = createEntityHooks<Tooth>({
	sanitize: sanitizeToothForStore,
	tableId: TABLE_IDS.TEETHING,
	toEntity: toTooth,
});

export const useUpsertTooth = teethingHooks.useUpsert;
export const useRemoveTooth = teethingHooks.useRemove;
export const useTooth = teethingHooks.useOne;
export const useTeethSnapshot = teethingHooks.useSnapshot;
export const useTeethIds = teethingHooks.useIds;
