import { growthMeasurements } from '@/data/growth-measurments';
import { useArrayState } from './use-array-state';

export const useGrowthMeasurements = () =>
	useArrayState(growthMeasurements, 'growthMeasurements-backup');
