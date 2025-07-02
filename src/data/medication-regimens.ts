// src/data/medication-regimens.ts
import { proxy } from 'valtio';
import { MedicationRegimen } from '@/types/medication-regimen';
import { Encrypted } from '@/utils/crypto';

// Initialize with an empty array.
// The type Encrypted<MedicationRegimen[]> is effectively Array<Encrypted<Item>> & { __type: 'array' }.
// An empty array [] is a valid assignment for the Array<Encrypted<Item>> part.
// useEncryptedArrayState expects an actual array for its .map operations.
export const medicationRegimensProxy = proxy<Encrypted<MedicationRegimen[]>>(
	// @ts-expect-error Argument of type 'never[]' is not assignable to parameter of type 'Encrypted<MedicationRegimen[]>'.
	[],
);
