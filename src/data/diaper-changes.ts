import { proxy } from 'valtio';
import { DiaperChange } from '@/types/diaper';
import { Encrypted } from '@/utils/crypto';

export const diaperChanges = proxy([] as unknown as Encrypted<DiaperChange[]>);
