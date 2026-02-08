import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useTableArrayState } from './use-table-array-state';

export const useGrowthMeasurements = () =>
	useTableArrayState(TABLE_IDS.GROWTH_MEASUREMENTS);
