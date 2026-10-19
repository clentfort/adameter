import type { DiaperChange } from '@/types/diaper';
import { useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeDiaperChangeForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { diaperChangeSchema } from '@/types/diaper';
import { createEntityHooks, createRowParser } from './create-entity-hooks';
import { useSelectedProfileId } from './use-selected-profile-id';

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

export function useLatestDiaperChangeRecord() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.DIAPER_CHANGES, store);
	const [selectedProfileId] = useSelectedProfileId();

	return useMemo(() => {
		let latestChange: DiaperChange | undefined;

		for (const [changeId, row] of Object.entries(table)) {
			if (selectedProfileId && row.profileId !== selectedProfileId) {
				continue;
			}
			const change = toDiaperChange(changeId, row);
			if (!change) {
				continue;
			}
			if (!latestChange || change.timestamp > latestChange.timestamp) {
				latestChange = change;
			}
		}

		return latestChange;
	}, [table, selectedProfileId]);
}
