import type { Event } from '@/types/event';
import { useCallback, useMemo } from 'react';
import {
	useDelRowCallback,
	useSetRowCallback,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useEvents = () => {
	const table = useTable(TABLE_IDS.EVENTS);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as Event,
			),
		[table],
	);

	const add = useSetRowCallback(
		TABLE_IDS.EVENTS,
		(item: Event) => item.id,
		(item: Event) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const update = useSetRowCallback(
		TABLE_IDS.EVENTS,
		(item: Event) => item.id,
		(item: Event) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const remove = useDelRowCallback(TABLE_IDS.EVENTS, (id: string) => id, []);

	// useArrayState had a replace method but it's rarely used.
	// We'll implement it for compatibility if needed.
	const replace = useCallback(() => {
		// Implementation not strictly needed based on current usage,
		// but useArrayState had it.
		console.warn('replace is not implemented in useEvents');
	}, []);

	return {
		add,
		remove,
		replace,
		update,
		value,
	} as const;
};
