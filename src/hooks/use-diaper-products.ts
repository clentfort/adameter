import { useMemo } from 'react';
import {
	useDelRowCallback,
	useSetRowCallback,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { DiaperProduct } from '@/types/diaper';
import { getDeviceId } from '@/utils/device-id';

export const useDiaperProducts = () => {
	const table = useTable(TABLE_IDS.DIAPER_PRODUCTS);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as DiaperProduct,
			),
		[table],
	);

	const add = useSetRowCallback(
		TABLE_IDS.DIAPER_PRODUCTS,
		(item: DiaperProduct) => item.id,
		(item: DiaperProduct) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const update = useSetRowCallback(
		TABLE_IDS.DIAPER_PRODUCTS,
		(item: DiaperProduct) => item.id,
		(item: DiaperProduct) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const remove = useDelRowCallback(
		TABLE_IDS.DIAPER_PRODUCTS,
		(id: string) => id,
		[],
	);

	return {
		add,
		remove,
		update,
		value,
	} as const;
};
