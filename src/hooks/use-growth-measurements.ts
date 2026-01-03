import { GrowthMeasurement } from '@/types/growth';
import { useArrayState } from './use-array-state';

export const useGrowthMeasurements = () =>
	useArrayState<GrowthMeasurement>('growth-measurements');
