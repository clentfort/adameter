import type { MedicationAdministration } from '@/types/medication';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { useArrayState } from './use-array-state';

export const useMedicationAdministrations = () =>
	useArrayState<MedicationAdministration>(TABLE_IDS.MEDICATION_ADMINISTRATIONS);
