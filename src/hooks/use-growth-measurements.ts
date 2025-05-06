import { growthMeasurements } from '@/data/growth-measurments';
import { useEncryptedArrayState } from './use-encrypted-array-state';

export const useGrowthMeasurements = () =>
	useEncryptedArrayState(growthMeasurements, 'growthMeasurements-backup');
