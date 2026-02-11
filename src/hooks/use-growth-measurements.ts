import type { GrowthMeasurement } from '@/types/growth';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useGrowthMeasurements = () =>
	useArrayState<GrowthMeasurement>(TABLE_IDS.GROWTH_MEASUREMENTS);
