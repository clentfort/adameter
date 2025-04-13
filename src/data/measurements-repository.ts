import { GrowthMeasurement } from '@/types/growth';
import { Repository } from './repository';

export const measurementsRepository = new Repository<GrowthMeasurement>(
	'growthMeasurements',
);
