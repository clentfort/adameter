import { proxy } from 'valtio';
import { Tooth } from '@/types/tooth';

export const teeth = proxy<Tooth[]>([]);