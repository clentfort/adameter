import type { FeedingSession } from '@/types/feeding';
import { useCallback, useMemo } from 'react';
import {
	useDelRowCallback,
	useSetRowCallback,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useFeedingSessions = () => {
	const table = useTable(TABLE_IDS.FEEDING_SESSIONS);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as FeedingSession,
			),
		[table],
	);

	const add = useSetRowCallback(
		TABLE_IDS.FEEDING_SESSIONS,
		(item: FeedingSession) => item.id,
		(item: FeedingSession) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const update = useSetRowCallback(
		TABLE_IDS.FEEDING_SESSIONS,
		(item: FeedingSession) => item.id,
		(item: FeedingSession) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const remove = useDelRowCallback(
		TABLE_IDS.FEEDING_SESSIONS,
		(id: string) => id,
		[],
	);

	const replace = useCallback(() => {
		console.warn('replace is not implemented in useFeedingSessions');
	}, []);

	return {
		add,
		remove,
		replace,
		update,
		value,
	} as const;
};
