import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useGrowthMeasurements = () =>
	useArrayState(TABLE_IDS.GROWTH_MEASUREMENTS);
