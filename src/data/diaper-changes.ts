import { proxy } from 'valtio';
import { DiaperChange } from '@/types/diaper';

export const diaperChanges = proxy<DiaperChange[]>([]);
