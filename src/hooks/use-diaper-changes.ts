import type { DiaperChange } from '@/types/diaper';
import { useMemo } from 'react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeDiaperChangeForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { diaperChangeSchema } from '@/types/diaper';
import { createEntityHooks, createRowParser } from './create-entity-hooks';

const toDiaperChange = createRowParser(diaperChangeSchema, 'diaper change');

const diaperChangeHooks = createEntityHooks<DiaperChange>({
	sanitize: sanitizeDiaperChangeForStore,
	tableId: TABLE_IDS.DIAPER_CHANGES,
	toEntity: toDiaperChange,
});

export const useUpsertDiaperChange = diaperChangeHooks.useUpsert;
export const useRemoveDiaperChange = diaperChangeHooks.useRemove;
export const useDiaperChange = diaperChangeHooks.useOne;
export const useDiaperChangesSnapshot = diaperChangeHooks.useSnapshot;
export const useDiaperChangeIds = diaperChangeHooks.useIds;

export function useDiaperChangesTotal() {
	return useDiaperChangeIds().length;
}

export function useLatestDiaperChangeRecord(): DiaperChange | undefined {
	const diaperChanges = useDiaperChangesSnapshot();

	return useMemo(
		() =>
			diaperChanges.reduce<DiaperChange | undefined>(
				(latest, change) =>
					!latest || change.timestamp > latest.timestamp ? change : latest,
				undefined,
			),
		[diaperChanges],
	);
}
