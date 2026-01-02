
import { describe, it, expect } from 'vitest';
import { toCsv, fromCsv } from './csv';

describe('CSV Integration', () => {
	it('should correctly import what it exports, respecting type definitions for defaults', () => {
		const data = [
			{
				id: '1', // Valid case
				containsUrine: 'true',
				containsStool: 'false',
				leakage: 'true',
				temperature: '37.5',
			},
			{
				id: '2', // Empty and invalid values
				timestamp: '2022-01-01',
				containsUrine: '', // required boolean -> false
				containsStool: 'not-a-boolean', // required boolean -> false
				leakage: '', // optional boolean -> undefined
				temperature: 'invalid-temp', // optional numeric -> undefined
			},
			{
				id: '3', // Case-insensitivity and different values
				timestamp: '2022-01-02',
				containsUrine: 'TRUE',
				containsStool: 'FALSE',
				leakage: 'false',
				temperature: '', // optional numeric -> undefined
			},
		];

		const csv = toCsv('diaperChanges', data);
		const parsedData = fromCsv(csv);

		const expectedData = [
			{
				id: '1',
				timestamp: '',
				abnormalities: '',
				diaperBrand: '',
				containsUrine: true,
				containsStool: false,
				leakage: true,
				temperature: 37.5,
			},
			{
				id: '2',
				timestamp: '2022-01-01',
				abnormalities: '',
				diaperBrand: '',
				containsUrine: false,
				containsStool: false,
				leakage: undefined,
				temperature: undefined,
			},
			{
				id: '3',
				timestamp: '2022-01-02',
				abnormalities: '',
				diaperBrand: '',
				containsUrine: true,
				containsStool: false,
				leakage: false,
				temperature: undefined,
			},
		];

		expect(parsedData).toEqual(expectedData);
	});
});
