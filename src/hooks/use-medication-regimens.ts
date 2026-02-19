import type { MedicationRegimen } from '@/types/medication';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useMedicationRegimens = () =>
	useArrayState<MedicationRegimen>(TABLE_IDS.MEDICATION_REGIMENS);
