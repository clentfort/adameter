import { proxy } from 'valtio';
import { MedicationAdministration } from '@/types/medication';

export const medicationsProxy = proxy<MedicationAdministration[]>([]);
