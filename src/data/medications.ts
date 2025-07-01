import type { Medication } from '@/types/medication';
import { proxy } from 'valtio';

export const medications = proxy<Medication[]>([]);
