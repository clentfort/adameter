
import { describe, it, expect } from 'vitest';
import { toCsv, fromCsv } from './csv';

describe('CSV Integration', () => {
	it('should correctly import what it exports, including handling of invalid and empty values', () => {
		const data = [
			{
				id: '1',
				name: 'test',
				containsUrine: 'true',
				containsStool: 'false',
				leakage: 'not-a-boolean',
				temperature: '37.5',
			},
			{
				id: '2',
				name: 'test2',
				timestamp: '2022-01-01',
				containsUrine: '',
				containsStool: 'true',
				leakage: 'false',
				temperature: 'invalid-temp',
			},
			{
				id: '3',
				name: 'test3',
				timestamp: '2022-01-02',
				containsUrine: 'TRUE',
				containsStool: 'FALSE',
				leakage: '',
				temperature: '',
			},
		];

		const csv = toCsv('diaperChanges', data);
		const parsedData = fromCsv(csv);

		const expectedData = [
			{
				id: '1',
				timestamp: '',
				containsUrine: true,
				containsStool: false,
				abnormalities: '',
				diaperBrand: '',
				leakage: null,
				temperature: 37.5,
			},
			{
				id: '2',
				timestamp: '2022-01-01',
				containsUrine: null,
				containsStool: true,
				abnormalities: '',
				diaperBrand: '',
				leakage: false,
				temperature: null,
			},
			{
				id: '3',
				timestamp: '2022-01-02',
				containsUrine: true,
				containsStool: false,
				abnormalities: '',
				diaperBrand: '',
				leakage: null,
				temperature: null,
			},
		];

		expect(parsedData).toEqual(expectedData);
	});
});
