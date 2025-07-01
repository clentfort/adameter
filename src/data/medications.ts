// src/data/medications.ts
import { proxy } from 'valtio';
import { MedicationAdministration } from '@/types/medication';
import { Encrypted } from '@/utils/crypto';

// Initialize with an empty array.
// The type Encrypted<MedicationAdministration[]> is effectively Array<Encrypted<Item>> & { __type: 'array' }.
// An empty array [] is a valid assignment for the Array<Encrypted<Item>> part.
// useEncryptedArrayState expects an actual array for its .map operations.
export const medicationsProxy = proxy<Encrypted<MedicationAdministration[]>>(
	[],
);
