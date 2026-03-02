import { useMemo } from 'react';
import { FeedingSession } from '@/types/feeding';
import { useFeedingSessions } from './use-feeding-sessions';

import { useStore, useRowIds } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

export function useLatestFeedingSession(): FeedingSession | undefined {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.FEEDING_SESSIONS);

	return useMemo(() => {
		if (rowIds.length === 0) {
			return undefined;
		}

		let latestId = rowIds[0];
		let latestEndTime =
			(store.getCell(TABLE_IDS.FEEDING_SESSIONS, latestId, 'endTime') as
				| string
				| undefined) ?? '';

		for (let index = 1; index < rowIds.length; index += 1) {
			const id = rowIds[index];
			const endTime =
				(store.getCell(TABLE_IDS.FEEDING_SESSIONS, id, 'endTime') as
					| string
					| undefined) ?? '';
			if (endTime > latestEndTime) {
				latestId = id;
				latestEndTime = endTime;
			}
		}

		const row = store.getRow(TABLE_IDS.FEEDING_SESSIONS, latestId);
		return { ...row, id: latestId } as unknown as FeedingSession;
	}, [rowIds, store]);
}
