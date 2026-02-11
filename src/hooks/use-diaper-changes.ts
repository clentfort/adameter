import type { DiaperChange } from '@/types/diaper';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useDiaperChanges = () =>
	useArrayState<DiaperChange>(TABLE_IDS.DIAPER_CHANGES);
