import type { DiaperChange } from '@/types/diaper';
import { useCallback, useMemo } from 'react';
import {
	useDelRowCallback,
	useSetRowCallback,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useDiaperChanges = () => {
	const table = useTable(TABLE_IDS.DIAPER_CHANGES);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as DiaperChange,
			),
		[table],
	);

	const add = useSetRowCallback(
		TABLE_IDS.DIAPER_CHANGES,
		(item: DiaperChange) => item.id,
		(item: DiaperChange) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const update = useSetRowCallback(
		TABLE_IDS.DIAPER_CHANGES,
		(item: DiaperChange) => item.id,
		(item: DiaperChange) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const remove = useDelRowCallback(
		TABLE_IDS.DIAPER_CHANGES,
		(id: string) => id,
		[],
	);

	const replace = useCallback(() => {
		console.warn('replace is not implemented in useDiaperChanges');
	}, []);

	return {
		add,
		remove,
		replace,
		update,
		value,
	} as const;
};
