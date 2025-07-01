// src/data/medications.ts
import { proxy } from 'valtio';
import { Medication } from '@/types/medication';
import { Encrypted } from '@/utils/crypto'; // Import Encrypted

// Initialize with an empty array, as default data is now handled by the hook.
// The type is Encrypted<Medication[]> because useEncryptedArrayState expects
// its initial array argument `array: Encrypted<T[]>`
export const medicationsProxy = proxy<Encrypted<Medication[]>>([]);
