import type { GrowthMeasurement } from '@/types/growth';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useGrowthMeasurements = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.GROWTH_MEASUREMENTS, store);

	const value = useMemo(
		() =>
			Object.entries(table).map(
				([id, row]) => ({ ...row, id }) as unknown as GrowthMeasurement,
			),
		[table],
	);

	const add = useCallback(
		(item: GrowthMeasurement) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const update = useCallback(
		(item: GrowthMeasurement) => {
			const { id, ...cells } = item;
			store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, id, {
				...cells,
				deviceId: getDeviceId(),
			} as unknown as Record<string, string | number | boolean>);
		},
		[store],
	);

	const remove = useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.GROWTH_MEASUREMENTS, id);
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
