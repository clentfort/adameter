// src/data/medication-regimens.ts
import { proxy } from 'valtio';
import { MedicationRegimen } from '@/types/medication-regimen';
import { Encrypted } from '@/utils/crypto'; // Import Encrypted

// Initialize with an empty array, as default data is now handled by the hook.
// The type is Encrypted<MedicationRegimen[]> because useEncryptedArrayState expects
// its initial array argument `array: Encrypted<T[]>`
export const medicationRegimensProxy = proxy<Encrypted<MedicationRegimen[]>>([]);
