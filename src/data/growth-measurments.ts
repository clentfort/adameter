import { proxy } from 'valtio';
import { GrowthMeasurement } from '@/types/growth';

export const growthMeasurements = proxy<GrowthMeasurement[]>([]);
