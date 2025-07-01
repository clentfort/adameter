import { medicationRegimensProxy } from '@/data/medication-regimens';
import { useEncryptedArrayState } from './use-encrypted-array-state';

export const useMedicationRegimens = () =>
	useEncryptedArrayState(medicationRegimensProxy, 'medicationRegimens-backup');
