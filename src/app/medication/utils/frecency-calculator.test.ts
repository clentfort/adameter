// src/app/medication/utils/frecency-calculator.test.ts

import { describe, expect, it } from 'vitest'; // Added this line
import { MedicationAdministration } from '@/types/medication';
import { calculateFrecencySuggestions } from './frecency-calculator';

const baseTime = new Date(2024, 0, 10, 12, 0, 0).getTime(); // Jan 10, 2024, 12:00:00

const administrations: MedicationAdministration[] = [
	{
		administrationStatus: 'On Time',
		dosageAmount: 200,
		dosageUnit: 'mg',
		id: '1',
		medicationName: 'Paracetamol',
		timestamp: new Date(baseTime - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 400,
		dosageUnit: 'mg',
		id: '2',
		medicationName: 'Ibuprofen',
		timestamp: new Date(baseTime - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 200,
		dosageUnit: 'mg',
		id: '3',
		medicationName: 'Paracetamol',
		regimenId: 'reg-para-200',
		timestamp: new Date(baseTime).toISOString(), // Now
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 250,
		dosageUnit: 'ml',
		id: '4',
		medicationName: 'Amoxicillin',
		timestamp: new Date(baseTime - 1000 * 60 * 30).toISOString(), // 30 mins ago
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 500, // Different dosage
		dosageUnit: 'mg',
		id: '5',
		medicationName: 'Paracetamol',
		timestamp: new Date(baseTime - 1000 * 60 * 5).toISOString(), // 5 mins ago
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 400,
		dosageUnit: 'mg',
		id: '6',
		medicationName: 'Ibuprofen', // Same as #2
		timestamp: new Date(baseTime - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago (older)
	},
	{
		administrationStatus: 'On Time',
		dosageAmount: 200,
		dosageUnit: 'MG', // Case-insensitivity check for unit
		id: '7',
		medicationName: 'paracetamol', // Case-insensitivity check for name
		timestamp: new Date(baseTime - 1000 * 60 * 10).toISOString(), // 10 mins ago
	},
];

describe('calculateFrecencySuggestions', () => {
	it('should return an empty array for no administrations', () => {
		expect(calculateFrecencySuggestions([])).toEqual([]);
	});

	it('should correctly calculate frecency and sort suggestions', () => {
		const suggestions = calculateFrecencySuggestions(administrations);

		// Expected order:
		// 1. Paracetamol 200mg (count 3, latest 'now' via ID 3, then ID 7 10 mins ago, then ID 1 2 hours ago)
		// 2. Ibuprofen 400mg (count 2, latest '1 hour ago' via ID 2, then ID 6 3 hours ago)
		// 3. Paracetamol 500mg (count 1, latest '5 mins ago' via ID 5)
		// 4. Amoxicillin 250ml (count 1, latest '30 mins ago' via ID 4)

		expect(suggestions).toHaveLength(4);

		// Check Paracetamol 200mg (should be first due to highest count)
		expect(suggestions[0]).toMatchObject({
			dosageAmount: 200,
			dosageUnit: 'mg', // from ID 3 or 7
			id: 'paracetamol-200-mg',
			isRegimen: false,
			label: 'Paracetamol', // or 'paracetamol' depending on first entry, map key normalizes
			medicationName: 'Paracetamol', // from ID 3 or 7 (most recent of this combo)
			regimenId: 'reg-para-200', // From ID 3, the most recent Paracetamol 200mg
		});

		// Check Ibuprofen 400mg (second due to count 2)
		expect(suggestions[1]).toMatchObject({
			dosageAmount: 400,
			dosageUnit: 'mg',
			id: 'ibuprofen-400-mg',
			isRegimen: false,
			label: 'Ibuprofen',
			medicationName: 'Ibuprofen',
			// regimenId should be undefined as neither source had one
		});
		expect(suggestions[1].regimenId).toBeUndefined();

		// Check Paracetamol 500mg (count 1, more recent than Amoxicillin)
		expect(suggestions[2]).toMatchObject({
			dosageAmount: 500,
			dosageUnit: 'mg',
			id: 'paracetamol-500-mg',
			isRegimen: false,
			label: 'Paracetamol',
			medicationName: 'Paracetamol',
		});

		// Check Amoxicillin 250ml (count 1, older than Paracetamol 500mg)
		expect(suggestions[3]).toMatchObject({
			dosageAmount: 250,
			dosageUnit: 'ml',
			id: 'amoxicillin-250-ml',
			isRegimen: false,
			label: 'Amoxicillin',
			medicationName: 'Amoxicillin',
		});
	});

	it('should be case-insensitive for medication name and unit for grouping', () => {
		const caseTestAdmin: MedicationAdministration[] = [
			{
				administrationStatus: 'On Time',
				dosageAmount: 10,
				dosageUnit: 'ml',
				id: 'a1',
				medicationName: 'MedX',
				timestamp: new Date(baseTime).toISOString(),
			},
			{
				administrationStatus: 'On Time',
				dosageAmount: 10,
				dosageUnit: 'ML', // Uppercase unit
				id: 'a2',
				medicationName: 'medx', // Lowercase name
				timestamp: new Date(baseTime + 1000).toISOString(), // More recent
			},
			{
				administrationStatus: 'On Time',
				dosageAmount: 10,
				dosageUnit: 'ml',
				id: 'a3',
				medicationName: 'MedY',
				timestamp: new Date(baseTime + 2000).toISOString(),
			},
		];
		const suggestions = calculateFrecencySuggestions(caseTestAdmin);
		expect(suggestions).toHaveLength(2); // MedX and MedY

		// MedX should have count 2, and its details from the most recent one ('a2')
		const medXSuggestion = suggestions.find((s) => s.id === 'medx-10-ml');
		expect(medXSuggestion).toBeDefined();
		// The medicationName and dosageUnit should be from one of the entries,
		// the frecencyMap stores the first encountered casing for name/unit, then updates timestamp/count.
		// Let's ensure the original casing of the most recent item for these fields is preferred if possible,
		// or at least consistent. The current implementation stores the first encountered.
		// For the test, we'll accept that the `id` is normalized.
		// The `label`, `medicationName`, `dosageUnit` will be from the first entry that created the key.
		// The test data is set up such that 'MedX' and 'ml' are first.
		expect(medXSuggestion?.medicationName).toBe('MedX'); // From 'a1'
		expect(medXSuggestion?.dosageUnit).toBe('ml'); // From 'a1'
	});
});
