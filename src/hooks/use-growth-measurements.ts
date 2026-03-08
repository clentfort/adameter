import type { Row } from 'tinybase';
import type { GrowthMeasurement } from '@/types/growth';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeGrowthMeasurementForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { createEntityHooks } from './create-entity-hooks';

function toGrowthMeasurement(id: string, row: Row): GrowthMeasurement {
	return {
		...row,
		id,
	} as GrowthMeasurement;
}

const growthMeasurementHooks = createEntityHooks<GrowthMeasurement>({
	sanitize: sanitizeGrowthMeasurementForStore,
	tableId: TABLE_IDS.GROWTH_MEASUREMENTS,
	toEntity: toGrowthMeasurement,
});

export const useUpsertGrowthMeasurement = growthMeasurementHooks.useUpsert;
export const useRemoveGrowthMeasurement = growthMeasurementHooks.useRemove;
export const useGrowthMeasurement = growthMeasurementHooks.useOne;
export const useGrowthMeasurementsSnapshot = growthMeasurementHooks.useSnapshot;
export const useGrowthMeasurementIds = growthMeasurementHooks.useIds;
