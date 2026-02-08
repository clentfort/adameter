import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useDiaperChanges = () => useArrayState(TABLE_IDS.DIAPER_CHANGES);
