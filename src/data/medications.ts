// src/data/medications.ts
import { proxy } from 'valtio';
import { Medication } from '@/types/medication'; // Ensure this import path is correct

export const medicationsProxy = proxy<Medication[]>([
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
		timestamp: '2025-07-01T16:30:00.000Z', // Slightly adjusted
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
		dosageAmount: 250, // Still log expected amount even if missed
		id: 'med-admin-7',
		regimenId: 'regimen-antibiotic',
		timestamp: '2025-06-30T00:00:00.000Z', // Missed dose
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 10,
		id: 'med-admin-8',
		regimenId: 'regimen-old-iron',
		timestamp: '2025-05-29T17:00:00.000Z',
	},
]);
