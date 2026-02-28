import type { Tooth } from '@/types/teething';
import { useCallback, useMemo } from 'react';
import {
	useDelRowCallback,
	useSetRowCallback,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useTeething = () => {
	const table = useTable(TABLE_IDS.TEETHING);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as Tooth,
			),
		[table],
	);

	const add = useSetRowCallback(
		TABLE_IDS.TEETHING,
		(item: Tooth) => item.id,
		(item: Tooth) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const update = useSetRowCallback(
		TABLE_IDS.TEETHING,
		(item: Tooth) => item.id,
		(item: Tooth) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const remove = useDelRowCallback(TABLE_IDS.TEETHING, (id: string) => id, []);

	const replace = useCallback(() => {
		console.warn('replace is not implemented in useTeething');
	}, []);

	return {
		add,
		remove,
		replace,
		update,
		value,
	} as const;
};
