import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useTableArrayState } from './use-table-array-state';

export const useDiaperChanges = () =>
	useTableArrayState(TABLE_IDS.DIAPER_CHANGES);
