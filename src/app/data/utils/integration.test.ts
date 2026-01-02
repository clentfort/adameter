
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
				abnormalities: 'None',
				diaperBrand: 'Pampers',
			},
			{
				id: '2', // Empty and invalid values
				timestamp: '2022-01-01',
				containsUrine: '', // required boolean -> false
				containsStool: 'not-a-boolean', // required boolean -> false
				leakage: '', // optional boolean -> undefined
				temperature: 'invalid-temp', // optional numeric -> undefined
				abnormalities: '',
				diaperBrand: '',
			},
			{
				id: '3', // Case-insensitivity and different values
				timestamp: '2022-01-02',
				containsUrine: 'TRUE',
				containsStool: 'FALSE',
				leakage: 'false',
				temperature: '', // optional numeric -> undefined
				abnormalities: 'A bit reddish',
				diaperBrand: 'Huggies',
			},
		];

		const csv = toCsv('diaperChanges', data);
		const parsedData = fromCsv(csv);

		const expectedData = [
			{
				id: '1',
				timestamp: '',
				abnormalities: 'None',
				diaperBrand: 'Pampers',
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
				abnormalities: 'A bit reddish',
				diaperBrand: 'Huggies',
				containsUrine: true,
				containsStool: false,
				leakage: false,
				temperature: undefined,
			},
		];

		expect(parsedData).toEqual(expectedData);
	});

	it('should correctly parse required numeric fields for feeding sessions', () => {
		const data = [
			{
				id: 'fs1',
				startTime: '2023-01-01T10:00:00Z',
				endTime: '2023-01-01T10:20:00Z',
				durationInSeconds: '1200',
				breast: 'left',
			},
			{
				id: 'fs2',
				startTime: '2023-01-01T11:00:00Z',
				endTime: '2023-01-01T11:15:00Z',
				durationInSeconds: '', // empty value
				breast: 'right',
			},
			{
				id: 'fs3',
				startTime: '2023-01-01T12:00:00Z',
				endTime: '2023-01-01T12:25:00Z',
				durationInSeconds: 'invalid-duration', // invalid value
				breast: 'left',
			},
		];

		const csv = toCsv('feedingSessions', data);
		const parsedData = fromCsv(csv);

		const expectedData = [
			{
				id: 'fs1',
				startTime: '2023-01-01T10:00:00Z',
				endTime: '2023-01-01T10:20:00Z',
				durationInSeconds: 1200,
				breast: 'left',
			},
			{
				id: 'fs2',
				startTime: '2023-01-01T11:00:00Z',
				endTime: '2023-01-01T11:15:00Z',
				durationInSeconds: 0,
				breast: 'right',
			},
			{
				id: 'fs3',
				startTime: '2023-01-01T12:00:00Z',
				endTime: '2023-01-01T12:25:00Z',
				durationInSeconds: 0,
				breast: 'left',
			},
		];

		expect(parsedData).toEqual(expectedData);
	});
});
