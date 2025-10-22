import { diaperChanges } from '@/data/diaper-changes';
import { useArrayState } from './use-array-state';

export const useDiaperChanges = () =>
	useArrayState(diaperChanges, 'diaperChanges-backup');
