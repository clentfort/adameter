import type { Row } from 'tinybase';
import type { Tooth } from '@/types/teething';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeToothForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { createEntityHooks } from './create-entity-hooks';

function toTooth(id: string, row: Row): Tooth {
	return {
		...row,
		id,
	} as Tooth;
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
