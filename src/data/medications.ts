import { proxy } from 'valtio';
import { MedicationAdministration } from '@/types/medication';
import { Encrypted } from '@/utils/crypto';

export const medicationsProxy = proxy<Encrypted<MedicationAdministration[]>>(
	// @ts-expect-error Argument of type 'never[]' is not assignable to parameter of type 'Encrypted<MedicationAdministration[]>'.
	[],
);
