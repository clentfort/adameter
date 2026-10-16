import type { GrowthMeasurement } from '@/types/growth';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeGrowthMeasurementForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { growthMeasurementSchema } from '@/types/growth';
import { createEntityHooks, createRowParser } from './create-entity-hooks';

const toGrowthMeasurement = createRowParser(
	growthMeasurementSchema,
	'growth measurement',
);

const growthMeasurementHooks = createEntityHooks<GrowthMeasurement>({
	sanitize: sanitizeGrowthMeasurementForStore,
	tableId: TABLE_IDS.GROWTH_MEASUREMENTS,
	toEntity: toGrowthMeasurement,
});

export const useUpsertGrowthMeasurement = growthMeasurementHooks.useUpsert;
export const useRemoveGrowthMeasurement = growthMeasurementHooks.useRemove;
export const useGrowthMeasurement = growthMeasurementHooks.useOne;
export const useGrowthMeasurementsSnapshot = growthMeasurementHooks.useSnapshot;
