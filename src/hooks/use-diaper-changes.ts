import type { DiaperChange } from '@/types/diaper';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeDiaperChangeForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { useTinybaseEntityTable } from './use-tinybase-entity-table';

export const useDiaperChanges = () =>
	useTinybaseEntityTable<DiaperChange>(
		TABLE_IDS.DIAPER_CHANGES,
		sanitizeDiaperChangeForStore,
	);
