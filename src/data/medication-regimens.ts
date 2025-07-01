import type { MedicationRegimen } from '@/types/medication-regimen';
import { proxy } from 'valtio';

export const medicationRegimens = proxy<MedicationRegimen[]>([]);
