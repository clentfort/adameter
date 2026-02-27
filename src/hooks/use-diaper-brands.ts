import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { DiaperBrand } from '@/types/diaper-brand';
import { useArrayState } from './use-array-state';

export const useDiaperBrands = () =>
	useArrayState<DiaperBrand>(TABLE_IDS.DIAPER_BRANDS);
