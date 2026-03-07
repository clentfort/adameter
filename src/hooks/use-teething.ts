import type { Tooth } from '@/types/teething';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { sanitizeToothForStore } from '@/lib/tinybase-sync/entity-row-schemas';
import { useTinybaseEntityTable } from './use-tinybase-entity-table';

export const useTeething = () =>
	useTinybaseEntityTable<Tooth>(TABLE_IDS.TEETHING, sanitizeToothForStore);
