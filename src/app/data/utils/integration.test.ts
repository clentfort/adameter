import { describe, expect, it } from 'vitest';
import { fromCsv, toCsv } from './csv';

describe('CSV Integration', () => {
	it('should correctly import what it exports, respecting type definitions for defaults', () => {
		const data = [
			{
				abnormalities: 'None',
				containsStool: 'false',
				containsUrine: 'true',
				diaperBrand: 'Pampers',
				id: '1', // Valid case
				leakage: 'true',
				temperature: '37.5',
			},
			{
				abnormalities: '',
				containsStool: 'not-a-boolean', // required boolean -> false
				containsUrine: '', // required boolean -> false
				diaperBrand: '',
				id: '2', // Empty and invalid values
				leakage: '', // optional boolean -> undefined
				temperature: 'invalid-temp', // optional numeric -> undefined
				timestamp: '2022-01-01',
			},
			{
				abnormalities: 'A bit reddish',
				containsStool: 'FALSE',
				containsUrine: 'TRUE',
				diaperBrand: 'Huggies',
				id: '3', // Case-insensitivity and different values
				leakage: 'false',
				temperature: '', // optional numeric -> undefined
				timestamp: '2022-01-02',
			},
		];

		const csv = toCsv('diaperChanges', data);
		const parsedData = fromCsv(csv);

		const expectedData = [
			{
				abnormalities: 'None',
				containsStool: false,
				containsUrine: true,
				deviceId: '',
				diaperBrand: 'Pampers',
				id: '1',
				leakage: true,
				temperature: 37.5,
				timestamp: '',
			},
			{
				abnormalities: '',
				containsStool: false,
				containsUrine: false,
				deviceId: '',
				diaperBrand: '',
				id: '2',
				leakage: undefined,
				temperature: undefined,
				timestamp: '2022-01-01',
			},
			{
				abnormalities: 'A bit reddish',
				containsStool: false,
				containsUrine: true,
				deviceId: '',
				diaperBrand: 'Huggies',
				id: '3',
				leakage: false,
				temperature: undefined,
				timestamp: '2022-01-02',
			},
		];

		expect(parsedData).toEqual(expectedData);
	});

	it('should correctly parse required numeric fields for feeding sessions', () => {
		const data = [
			{
				breast: 'left',
				durationInSeconds: '1200',
				endTime: '2023-01-01T10:20:00Z',
				id: 'fs1',
				startTime: '2023-01-01T10:00:00Z',
			},
			{
				breast: 'right',
				durationInSeconds: '', // empty value
				endTime: '2023-01-01T11:15:00Z',
				id: 'fs2',
				startTime: '2023-01-01T11:00:00Z',
			},
			{
				breast: 'left',
				durationInSeconds: 'invalid-duration', // invalid value
				endTime: '2023-01-01T12:25:00Z',
				id: 'fs3',
				startTime: '2023-01-01T12:00:00Z',
			},
		];

		const csv = toCsv('feedingSessions', data);
		const parsedData = fromCsv(csv);

		const expectedData = [
			{
				breast: 'left',
				deviceId: '',
				durationInSeconds: 1200,
				endTime: '2023-01-01T10:20:00Z',
				id: 'fs1',
				startTime: '2023-01-01T10:00:00Z',
			},
			{
				breast: 'right',
				deviceId: '',
				durationInSeconds: 0,
				endTime: '2023-01-01T11:15:00Z',
				id: 'fs2',
				startTime: '2023-01-01T11:00:00Z',
			},
			{
				breast: 'left',
				deviceId: '',
				durationInSeconds: 0,
				endTime: '2023-01-01T12:25:00Z',
				id: 'fs3',
				startTime: '2023-01-01T12:00:00Z',
			},
		];

		expect(parsedData).toEqual(expectedData);
	});
});
