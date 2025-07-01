import { medications } from '@/data/medications';
import { useEncryptedArrayState } from './use-encrypted-array-state';

export const useMedications = () =>
	useEncryptedArrayState(medications, 'medications-backup');
