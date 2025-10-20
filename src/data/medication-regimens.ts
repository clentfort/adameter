import { proxy } from 'valtio';
import { MedicationRegimen } from '@/types/medication-regimen';

export const medicationRegimensProxy = proxy<MedicationRegimen[]>([]);
