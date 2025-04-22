import { atomWithStorage } from 'jotai/utils';
import { GrowthMeasurement } from '@/types/growth';

export const measurementsAtom = atomWithStorage<GrowthMeasurement[]>(
	'growthMeasurements',
	[],
	undefined,
	{
		getOnInit: true,
	},
);
