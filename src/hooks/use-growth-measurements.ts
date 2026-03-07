import type { GrowthMeasurement } from '@/types/growth';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeGrowthMeasurementForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { useTinybaseEntityTable } from './use-tinybase-entity-table';

export const useGrowthMeasurements = () =>
	useTinybaseEntityTable<GrowthMeasurement>(
		TABLE_IDS.GROWTH_MEASUREMENTS,
		sanitizeGrowthMeasurementForStore,
	);
