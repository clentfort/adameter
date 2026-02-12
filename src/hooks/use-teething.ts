import type { Tooth } from '@/types/teething';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useTeething = () => useArrayState<Tooth>(TABLE_IDS.TEETHING);
