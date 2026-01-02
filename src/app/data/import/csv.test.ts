
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { fromCsv, mergeData } from './csv';
import Papa from 'papaparse';

describe('Import CSV', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('fromCsv', () => {
		it('should parse a CSV string', () => {
			const csv =
				'id,timestamp,containsUrine,containsStool,abnormalities,diaperBrand,leakage,temperature\r\n1,,,,,,\r\n2,2022-01-01,,,,,';

			const data = fromCsv(csv);

			expect(data).toEqual([
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
			]);
		});
	});

	describe('mergeData', () => {
		it('should merge data into the data stores', () => {
			const diaperChanges = [{ id: '0' }];
			const data = [{ id: '1' }, { id: '2' }];

			mergeData(diaperChanges, data);

			expect(diaperChanges).toEqual([{ id: '0' }, { id: '1' }, { id: '2' }]);
		});
	});
});
