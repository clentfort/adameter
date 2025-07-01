// src/data/medication-regimens.ts
import { proxy } from 'valtio';
import { MedicationRegimen } from '@/types/medication-regimen'; // Ensure this import path is correct

export const medicationRegimensProxy = proxy<MedicationRegimen[]>([
	{
		dosageAmount: 0.5,
		dosageUnit: 'ml',
		id: 'regimen-vitamind',
		name: 'Vitamin D drops',
		notes: 'Take with morning feeding.',
		prescriber: 'Self',
		schedule: { times: ['09:00'], type: 'daily' },
		startDate: '2025-06-01T00:00:00.000Z',
	},
	{
		dosageAmount: 250,
		dosageUnit: 'mg',
		endDate: '2025-07-05T00:00:00.000Z',
		id: 'regimen-antibiotic',
		name: 'Amoxicillin',
		notes: 'Complete the full 7-day course. Shake well before use.',
		prescriber: 'Doctor',
		prescriberName: 'Dr. Schmidt',
		schedule: {
			firstDoseTime: '08:00',
			intervalUnit: 'hours',
			intervalValue: 8,
			type: 'interval',
		},
		startDate: '2025-06-28T00:00:00.000Z',
	},
	{
		dosageAmount: 2.5,
		dosageUnit: 'ml',
		id: 'regimen-feverreducer',
		name: 'Paracetamol Syrup',
		notes: 'Max 4 doses in 24 hours.',
		prescriber: 'Doctor',
		prescriberName: 'Dr. Schmidt',
		schedule: { details: 'When fever > 38.5°C', type: 'asNeeded' },
		startDate: '2025-06-15T00:00:00.000Z',
	},
	{
		dosageAmount: 10,
		dosageUnit: 'mg',
		endDate: '2025-05-31T00:00:00.000Z',
		id: 'regimen-old-iron',
		isDiscontinued: true,
		name: 'Iron Supplement',
		notes: 'Discontinued after 1 month.',
		prescriber: 'Midwife',
		prescriberName: 'Maria Müller',
		schedule: { times: ['17:00'], type: 'daily' },
		startDate: '2025-05-01T00:00:00.000Z',
	},
]);
