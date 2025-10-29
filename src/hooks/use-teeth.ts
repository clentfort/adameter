import { teeth } from '@/data/teeth';
import { useArrayState } from './use-array-state';

export const useTeeth = () => useArrayState(teeth, 'teeth-backup');