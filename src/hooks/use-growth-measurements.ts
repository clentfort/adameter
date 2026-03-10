import type { Row } from 'tinybase';
import type { GrowthMeasurement } from '@/types/growth';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeGrowthMeasurementForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { growthMeasurementSchema } from '@/types/growth';
import { createEntityHooks } from './create-entity-hooks';

function toGrowthMeasurement(id: string, row: Row): GrowthMeasurement | null {
	const result = growthMeasurementSchema.safeParse({
		...row,
		id,
	});

	if (!result.success) {
		// eslint-disable-next-line no-console
		console.warn(
			`Invalid growth measurement data for id ${id}:`,
			result.error.issues,
		);
		return null;
	}

	return result.data;
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
