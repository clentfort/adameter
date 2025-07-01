// src/data/medication-regimens.ts
import { proxy } from 'valtio';
import { MedicationRegimen } from '@/types/medication-regimen';
import { Encrypted } from '@/utils/crypto'; // Import Encrypted

// Initialize with an empty EncryptedArray object, as default data is now handled by the hook.
// The type is Encrypted<MedicationRegimen[]> because useEncryptedArrayState expects
// this shape.
export const medicationRegimensProxy = proxy<Encrypted<MedicationRegimen[]>>({ __type: 'array' });
