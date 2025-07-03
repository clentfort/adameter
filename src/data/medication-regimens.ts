import { proxy } from 'valtio';
import { MedicationRegimen } from '@/types/medication-regimen';
import { Encrypted } from '@/utils/crypto';

export const medicationRegimensProxy = proxy<Encrypted<MedicationRegimen[]>>(
	// @ts-expect-error Argument of type 'never[]' is not assignable to parameter of type 'Encrypted<MedicationRegimen[]>'.
	[],
);
