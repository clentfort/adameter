import { measurementsAtom } from '@/data/measurements-atom';
import { useArrayAtom } from './use-array-atom';

export const useGrowthMeasurements = () => useArrayAtom(measurementsAtom);
