import { useEffect } from 'react';
import { medicationsProxy } from '@/data/medications'; // Will be changed in a later step
import { useEncryptedArrayState } from './use-encrypted-array-state';
import { Medication } from '@/types/medication';
import { useEncryptionKey } from './use-encryption-key';

// Default data for medications
const defaultMedications: Medication[] = [
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		id: 'med-admin-1',
		regimenId: 'regimen-vitamind',
		timestamp: '2025-07-01T09:05:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		id: 'med-admin-2',
		regimenId: 'regimen-vitamind',
		timestamp: '2025-07-02T09:03:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 250,
		id: 'med-admin-3',
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-07-01T08:15:00.000Z',
	},
	{
		administrationStatus: 'Adjusted',
		details: 'Given 30 min late due to nap',
		dosageAmount: 250,
		id: 'med-admin-4',
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-07-01T16:30:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		details: 'Fever 39.2C',
		dosageAmount: 2.5,
		id: 'med-admin-5',
		regimenId: 'regimen-feverreducer',
		timestamp: '2025-07-01T21:00:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 0.5,
		id: 'med-admin-6',
		regimenId: 'regimen-vitamind',
		timestamp: '2025-06-30T09:00:00.000Z',
	},
	{
		administrationStatus: 'Missed',
		details: 'Forgot overnight dose',
		dosageAmount: 250,
		id: 'med-admin-7',
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-06-30T00:00:00.000Z',
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 10,
		id: 'med-admin-8',
		regimenId: 'regimen-old-iron',
		timestamp: '2025-05-29T17:00:00.000Z',
	},
];

export const useMedications = () => {
	const state = useEncryptedArrayState<Medication>(
		medicationsProxy, // This will be changed to an empty array proxy in a later step
		'medications-backup',
	);
	const secret = useEncryptionKey();

	useEffect(() => {
		// Only set default data if the current value is empty, secret is available,
		// and default data actually has items.
		if (state.value && state.value.length === 0 && secret && defaultMedications.length > 0) {
			state.replace(defaultMedications);
		}
		// defaultMedications is a module-level const and doesn't need to be in the dependency array.
	}, [state.value, state.replace, secret]);

	return state;
};
