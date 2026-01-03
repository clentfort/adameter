import { DiaperChange } from '@/types/diaper';
import { useArrayState } from './use-array-state';

export const useDiaperChanges = () =>
	useArrayState<DiaperChange>('diaper-changes');
