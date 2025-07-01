// src/data/medications.ts
import { proxy } from 'valtio';
import { MedicationAdministration } from '@/types/medication'; // Updated import
import { Encrypted } from '@/utils/crypto'; // Import Encrypted

// Initialize with an empty EncryptedArray object, as default data is now handled by the hook.
// The type is Encrypted<MedicationAdministration[]> because useEncryptedArrayState expects
// this shape.
export const medicationsProxy = proxy<Encrypted<MedicationAdministration[]>>({ __type: 'array' });
