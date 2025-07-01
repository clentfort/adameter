import { useEffect } from 'react';
import { medicationsProxy } from '@/data/medications';
import { MedicationAdministration } from '@/types/medication'; // Updated import
import { useEncryptedArrayState } from './use-encrypted-array-state';
import { useEncryptionKey } from './use-encryption-key';

// Default data for medication administrations
// Values for medicationName and dosageUnit are copied from defaultMedicationRegimens in use-medication-regimens.ts
const defaultMedications: MedicationAdministration[] = [
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		dosageUnit: 'ml', // Copied from regimen-vitamind
		id: 'med-admin-1',
		medicationName: 'Vitamin D drops', // Copied from regimen-vitamind
		regimenId: 'regimen-vitamind',
		timestamp: '2025-07-01T09:05:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		dosageUnit: 'ml', // Copied from regimen-vitamind
		id: 'med-admin-2',
		medicationName: 'Vitamin D drops', // Copied from regimen-vitamind
		regimenId: 'regimen-vitamind',
		timestamp: '2025-07-02T09:03:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 250,
		dosageUnit: 'mg', // Copied from regimen-antibiotic
		id: 'med-admin-3',
		medicationName: 'Amoxicillin', // Copied from regimen-antibiotic
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-07-01T08:15:00.000Z',
	},
	{
		administrationStatus: 'Adjusted',
		details: 'Given 30 min late due to nap',
		dosageAmount: 250,
		dosageUnit: 'mg', // Copied from regimen-antibiotic
		id: 'med-admin-4',
		medicationName: 'Amoxicillin', // Copied from regimen-antibiotic
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-07-01T16:30:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		details: 'Fever 39.2C',
		dosageAmount: 2.5,
		dosageUnit: 'ml', // Copied from regimen-feverreducer
		id: 'med-admin-5',
		medicationName: 'Paracetamol Syrup', // Copied from regimen-feverreducer
		regimenId: 'regimen-feverreducer',
		timestamp: '2025-07-01T21:00:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		dosageUnit: 'ml', // Copied from regimen-vitamind
		id: 'med-admin-6',
		medicationName: 'Vitamin D drops', // Copied from regimen-vitamind
		regimenId: 'regimen-vitamind',
		timestamp: '2025-06-30T09:00:00.000Z',
	},
	{
		administrationStatus: 'Missed',
		details: 'Forgot overnight dose',
		dosageAmount: 250,
		dosageUnit: 'mg', // Copied from regimen-antibiotic
		id: 'med-admin-7',
		medicationName: 'Amoxicillin', // Copied from regimen-antibiotic
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-06-30T00:00:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 10,
		dosageUnit: 'mg', // Copied from regimen-old-iron
		id: 'med-admin-8',
		medicationName: 'Iron Supplement', // Copied from regimen-old-iron
		regimenId: 'regimen-old-iron',
		timestamp: '2025-05-29T17:00:00.000Z',
	},
];

export const useMedications = () => {
	const state = useEncryptedArrayState<MedicationAdministration>( // Updated type
		medicationsProxy,
		'medications-backup',
	);
	const secret = useEncryptionKey();

	useEffect(() => {
		// Only set default data if the current value is empty, secret is available,
		// and default data actually has items.
		if (
			state.value &&
			state.value.length === 0 &&
			secret &&
			defaultMedications.length > 0
		) {
			state.replace(defaultMedications);
		}
		// defaultMedications is a module-level const and doesn't need to be in the dependency array.
	}, [state, secret]); // Added state to dependency array, state.value and state.replace are part of state.

	return state;
};
