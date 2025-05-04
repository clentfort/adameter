import { proxy } from 'valtio';
import { GrowthMeasurement } from '@/types/growth';
import { Encrypted } from '@/utils/crypto';

export const growthMeasurements = proxy(
	[] as unknown as Encrypted<GrowthMeasurement[]>,
);
