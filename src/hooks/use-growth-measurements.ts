import type { GrowthMeasurement } from '@/types/growth';
import { useCallback, useMemo } from 'react';
import { useRow, useRowIds, useStore } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { getDeviceId } from '@/utils/device-id';

export const useGrowthMeasurementRow = (id: string) => {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.GROWTH_MEASUREMENTS, id, store);
	return useMemo(() => ({ ...row, id }) as unknown as GrowthMeasurement, [id, row]);
};

export const useGrowthMeasurements = () => {
	const store = useStore()!;
	const rowIds = useRowIds(TABLE_IDS.GROWTH_MEASUREMENTS, store);

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
		rowIds,
		update,
	} as const;
};
