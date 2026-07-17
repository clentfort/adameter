import { describe, expect, it, vi } from 'vitest';
import Papa from 'papaparse';
import { fromCsv, toCsv } from './csv';

describe('CSV Data Transfer Utility', () => {
	describe('toCsv', () => {
		it('returns an empty string if the rows array is empty', () => {
			expect(toCsv([])).toBe('');
		});

		it('formats a basic row of data properly', () => {
			const rows = [
				{ id: '1', name: 'Ada', age: 1 },
				{ id: '2', name: 'Bob', age: 2 },
			];
			const csv = toCsv(rows);
			expect(csv).toContain('id,age,name');
			expect(csv).toContain('1,1,Ada');
			expect(csv).toContain('2,2,Bob');
		});

		it('sorts fields alphabetically with id first', () => {
			const rows = [{ zebra: 'stripes', id: 'abc', apple: 'red' }];
			const csv = toCsv(rows);
			const firstLine = csv.split('\n')[0].replace(/\r$/, '');
			expect(firstLine).toBe('id,apple,zebra');
		});

		it('applies nullish coalescing default value if row[field] is undefined or null', () => {
			const rows = [{ id: '1', missingValue: undefined, nullValue: null }];
			const csv = toCsv(rows);
			expect(csv).toContain('1,,');
		});

		it('handles case where there is no id field in getCsvFields', () => {
			const rows = [{ zebra: 'stripes', apple: 'red' }];
			const csv = toCsv(rows);
			const firstLine = csv.split('\n')[0].replace(/\r$/, '');
			expect(firstLine).toBe('apple,zebra');
		});
	});

	describe('fromCsv', () => {
		it('parses basic csv values back to objects', () => {
			const csv = 'id,name,age,active\n1,Ada,1,true\n2,Bob,2,false';
			const parsed = fromCsv(csv);
			expect(parsed).toEqual([
				{ id: '1', name: 'Ada', age: 1, active: true },
				{ id: '2', name: 'Bob', age: 2, active: false },
			]);
		});

		it('skips empty columns / empty field names', () => {
			const csv = 'id,,name\n1,ignored,Ada';
			const parsed = fromCsv(csv);
			expect(parsed).toEqual([
				{ id: '1', name: 'Ada' },
			]);
		});

		it('maps legacy abnormalities field to notes if notes is missing', () => {
			const csv = 'id,abnormalities\n1,Very abnormal';
			const parsed = fromCsv(csv);
			expect(parsed).toEqual([
				{ id: '1', notes: 'Very abnormal' },
			]);
		});

		it('does not map abnormalities if notes is already present', () => {
			const csv = 'id,notes,abnormalities\n1,Fine notes,Legacy ignored';
			const parsed = fromCsv(csv);
			expect(parsed).toEqual([
				{ id: '1', notes: 'Fine notes' },
			]);
		});

		it('parses various kinds of numbers correctly', () => {
			const csv = 'id,value,negative,decimal,tooBig,notQuiteNumeric\n1,123,-45,67.89,9999999999999999999999,9999-99-99';
			const parsed = fromCsv(csv);
			expect(parsed[0].value).toBe(123);
			expect(parsed[0].negative).toBe(-45);
			expect(parsed[0].decimal).toBe(67.89);
			expect(typeof parsed[0].tooBig).toBe('number');
			expect(parsed[0].notQuiteNumeric).toBe('9999-99-99');
		});

		it('returns string if matches number regex but overflows to non-finite Infinity', () => {
			// A string of 400 '9's will overflow to Infinity when parsed as a number.
			const hugeNumberString = '9'.repeat(400);
			const csv = `id,overflow\n1,${hugeNumberString}`;
			const parsed = fromCsv(csv);
			expect(parsed[0].overflow).toBe(hugeNumberString);
		});

		it('keeps id and valueJson as string types even if they look like numbers', () => {
			const csv = 'id,valueJson\n123,456';
			const parsed = fromCsv(csv);
			expect(parsed).toEqual([
				{ id: '123', valueJson: '456' },
			]);
		});

		it('handles non-string raw values gracefully by defaulting to empty string', () => {
			// Spy on Papa.parse to inject a non-string raw value
			const mockResult = {
				data: [
					{
						id: '1',
						nonStringField: null as unknown as string,
					},
				],
				errors: [],
				meta: {
					aborted: false,
					cursor: 0,
					delimiter: ',',
					fields: ['id', 'nonStringField'],
					linebreak: '\n',
					truncated: false,
				},
			};

			const spy = vi.spyOn(Papa, 'parse').mockReturnValueOnce(mockResult as unknown as any);

			const parsed = fromCsv('id,nonStringField\n1,null');
			expect(parsed).toEqual([
				{ id: '1', nonStringField: '' },
			]);

			spy.mockRestore();
		});
	});
});
