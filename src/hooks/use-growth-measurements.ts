import type { GrowthMeasurement } from '@/types/growth';
import { useCallback, useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeGrowthMeasurementForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { fromTable } from '@/lib/tinybase-sync/migration-utils';
import { getDeviceId } from '@/utils/device-id';

export const useGrowthMeasurements = () => {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.GROWTH_MEASUREMENTS, store);

	const value = useMemo(() => fromTable<GrowthMeasurement>(table), [table]);

	const add = useCallback(
		(item: GrowthMeasurement) => {
			const cells = sanitizeGrowthMeasurementForStore(item);
			if (!cells) {
				return;
			}

			store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, item.id, {
				...cells,
				deviceId: getDeviceId(),
			});
		},
		[store],
	);

	const update = useCallback(
		(item: GrowthMeasurement) => {
			const cells = sanitizeGrowthMeasurementForStore(item);
			if (!cells) {
				return;
			}

			store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, item.id, {
				...cells,
				deviceId: getDeviceId(),
			});
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
