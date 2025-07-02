import { diaperChanges } from '@/data/diaper-changes';
import { useEncryptedArrayState } from './use-encrypted-array-state';

export const useDiaperChanges = () =>
	useEncryptedArrayState(diaperChanges, 'diaperChanges-backup');
