import type { FeedingSession } from '@/types/feeding';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeFeedingSessionForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { fromTable } from '@/lib/tinybase-sync/migration-utils';
import { getDeviceId } from '@/utils/device-id';

export const useFeedingSessions = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.FEEDING_SESSIONS, store);

	const value = useMemo(() => fromTable<FeedingSession>(table), [table]);

	const add = useCallback(
		(item: FeedingSession) => {
			const cells = sanitizeFeedingSessionForStore(item);
			if (!cells) {
				return;
			}

			store.setRow(TABLE_IDS.FEEDING_SESSIONS, item.id, {
				...cells,
				deviceId: getDeviceId(),
			});
		},
		[store],
	);

	const update = useCallback(
		(item: FeedingSession) => {
			const cells = sanitizeFeedingSessionForStore(item);
			if (!cells) {
				return;
			}

			store.setRow(TABLE_IDS.FEEDING_SESSIONS, item.id, {
				...cells,
				deviceId: getDeviceId(),
			});
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.FEEDING_SESSIONS, id);
		},
		[store],
	);

	return {
		add,
		remove,
		update,
		value,
	} as const;
};
