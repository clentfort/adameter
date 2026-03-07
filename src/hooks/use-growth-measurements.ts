import type { Row } from 'tinybase';
import type { GrowthMeasurement } from '@/types/growth';
import { useCallback, useMemo } from 'react';
import { useRow, useStore, useTable } from 'tinybase/ui-react';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeGrowthMeasurementForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { getDeviceId } from '@/utils/device-id';

function toGrowthMeasurement(id: string, row: Row): GrowthMeasurement {
	return {
		...row,
		id,
	} as GrowthMeasurement;
}

export function useUpsertGrowthMeasurement() {
	const store = useStore()!;

	return useCallback(
		(measurement: GrowthMeasurement) => {
			const cells = sanitizeGrowthMeasurementForStore(measurement);
			if (!cells) {
				return;
			}

			store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, measurement.id, {
				...cells,
				deviceId: getDeviceId(),
			});
		},
		[store],
	);
}

export function useRemoveGrowthMeasurement() {
	const store = useStore()!;

	return useCallback(
		(id: string) => {
			store.delRow(TABLE_IDS.GROWTH_MEASUREMENTS, id);
		},
		[store],
	);
}

export function useGrowthMeasurement(measurementId: string | undefined) {
	const store = useStore()!;
	const row = useRow(TABLE_IDS.GROWTH_MEASUREMENTS, measurementId ?? '', store);

	return useMemo(() => {
		if (!measurementId || Object.keys(row).length === 0) {
			return undefined;
		}

		return toGrowthMeasurement(measurementId, row);
	}, [measurementId, row]);
}

export function useGrowthMeasurementsSnapshot() {
	const store = useStore()!;
	const table = useTable(TABLE_IDS.GROWTH_MEASUREMENTS, store);

	return useMemo(
		() =>
			Object.entries(table).map(([measurementId, row]) =>
				toGrowthMeasurement(measurementId, row),
			),
		[table],
	);
}
