
import { describe, it, expect } from 'vitest';
import { toCsv, fromCsv } from './csv';

describe('CSV Integration', () => {
	it('should correctly import what it exports', () => {
		const data = [
			{ id: '1', name: 'test' },
			{ id: '2', name: 'test2', timestamp: '2022-01-01' },
		];

		const csv = toCsv('diaperChanges', data);
		const parsedData = fromCsv(csv);

		const expectedData = [
			{
				id: '1',
				timestamp: '',
				containsUrine: '',
				containsStool: '',
				abnormalities: '',
				diaperBrand: '',
				leakage: '',
				temperature: '',
			},
			{
				id: '2',
				timestamp: '2022-01-01',
				containsUrine: '',
				containsStool: '',
				abnormalities: '',
				diaperBrand: '',
				leakage: '',
				temperature: '',
			},
		];

		expect(parsedData).toEqual(expectedData);
	});
});
