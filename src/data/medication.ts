import { proxy } from 'valtio';
import { Medication } from '@/types/medication';
import { Encrypted } from '@/utils/crypto';

export const medicationStore = proxy([] as unknown as Encrypted<Medication[]>);
