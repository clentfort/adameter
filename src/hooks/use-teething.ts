import type { Tooth } from '@/types/teething';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeToothForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { toothSchema } from '@/types/teething';
import { createEntityHooks, createRowParser } from './create-entity-hooks';

const toTooth = createRowParser(toothSchema, 'tooth');

const teethingHooks = createEntityHooks<Tooth>({
	sanitize: sanitizeToothForStore,
	tableId: TABLE_IDS.TEETHING,
	toEntity: toTooth,
});

export const useUpsertTooth = teethingHooks.useUpsert;
export const useRemoveTooth = teethingHooks.useRemove;
export const useTooth = teethingHooks.useOne;
export const useTeethSnapshot = teethingHooks.useSnapshot;
