import type { GrowthMeasurement } from '@/types/growth';
import { useCallback, useMemo } from 'react';
import {
	useDelRowCallback,
	useSetRowCallback,
	useTable,
} from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useGrowthMeasurements = () => {
	const table = useTable(TABLE_IDS.GROWTH_MEASUREMENTS);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as GrowthMeasurement,
			),
		[table],
	);

	const add = useSetRowCallback(
		TABLE_IDS.GROWTH_MEASUREMENTS,
		(item: GrowthMeasurement) => item.id,
		(item: GrowthMeasurement) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const update = useSetRowCallback(
		TABLE_IDS.GROWTH_MEASUREMENTS,
		(item: GrowthMeasurement) => item.id,
		(item: GrowthMeasurement) => ({ ...item, deviceId: getDeviceId() }),
		[],
	);

	const remove = useDelRowCallback(
		TABLE_IDS.GROWTH_MEASUREMENTS,
		(id: string) => id,
		[],
	);

	const replace = useCallback(() => {
		console.warn('replace is not implemented in useGrowthMeasurements');
	}, []);

	return {
		add,
		remove,
		replace,
		update,
		value,
	} as const;
};
