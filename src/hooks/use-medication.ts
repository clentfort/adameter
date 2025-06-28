import { medicationStore } from '@/data/medication';
import { useEncryptedArrayState } from './use-encrypted-array-state';

export const useMedication = () =>
	useEncryptedArrayState(medicationStore, 'medication-backup');
