import type { DiaperChange } from '@/types/diaper';
import { Repository } from './repository';

export const diaperRepository = new Repository<DiaperChange>('diaperChanges');
