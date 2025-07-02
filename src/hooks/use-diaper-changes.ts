import type { DiaperChange } from '@/types/diaper';
import { diaperChanges } from '@/data/diaper-changes';
import {
	useEncryptedArrayState,
	UseEncryptedArrayStateReturn,
} from './use-encrypted-array-state';

export type UseDiaperChangesReturn = UseEncryptedArrayStateReturn<DiaperChange>;

export const useDiaperChanges = (): UseDiaperChangesReturn =>
	useEncryptedArrayState<DiaperChange>(diaperChanges, 'diaperChanges-backup');
