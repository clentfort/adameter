import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { DiaperProduct } from '@/types/diaper';
import { useArrayState } from './use-array-state';

export const useDiaperProducts = () =>
	useArrayState<DiaperProduct>(TABLE_IDS.DIAPER_PRODUCTS);
