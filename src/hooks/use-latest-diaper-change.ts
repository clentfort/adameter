import { useMemo } from 'react';
import { DiaperChange } from '@/types/diaper';
import { useDiaperChanges } from './use-diaper-changes';

import { useStore, useRowIds } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { fromTable } from '@/lib/tinybase-sync/migration-utils';

export function useLatestDiaperChange(): DiaperChange | undefined {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.DIAPER_CHANGES);

	return useMemo(() => {
		if (rowIds.length === 0) {
			return undefined;
		}

		let latestId = rowIds[0];
		let latestTimestamp =
			(store.getCell(TABLE_IDS.DIAPER_CHANGES, latestId, 'timestamp') as
				| string
				| undefined) ?? '';

		for (let index = 1; index < rowIds.length; index += 1) {
			const id = rowIds[index];
			const timestamp =
				(store.getCell(TABLE_IDS.DIAPER_CHANGES, id, 'timestamp') as
					| string
					| undefined) ?? '';
			if (timestamp > latestTimestamp) {
				latestId = id;
				latestTimestamp = timestamp;
			}
		}

		const row = store.getRow(TABLE_IDS.DIAPER_CHANGES, latestId);
		return { ...row, id: latestId } as unknown as DiaperChange;
	}, [rowIds, store]);
}
