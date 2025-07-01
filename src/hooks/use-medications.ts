import { medicationsProxy } from '@/data/medications';
import { useEncryptedArrayState } from './use-encrypted-array-state';

export const useMedications = () =>
	useEncryptedArrayState(medicationsProxy, 'medications-backup');
