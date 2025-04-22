import { atomWithStorage } from 'jotai/utils';
import { DiaperChange } from '@/types/diaper';

export const diapersAtom = atomWithStorage<DiaperChange[]>(
	'diaperChanges',
	[],
	undefined,
	{ getOnInit: true },
);
