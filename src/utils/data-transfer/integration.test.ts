import { describe, expect, it } from 'vitest';
import { fromCsv, toCsv } from './csv';

describe('CSV Integration', () => {
	it('should correctly import what it exports, respecting type definitions for defaults', () => {
		const data = [
			{
				containsStool: 'false',
				containsUrine: 'true',
				diaperBrand: 'Pampers',
				id: '1', // Valid case
				leakage: 'true',
				notes: 'None',
				temperature: '37.5',
			},
			{
				containsStool: 'not-a-boolean', // required boolean -> false
				containsUrine: '', // required boolean -> false
				diaperBrand: '',
				id: '2', // Empty and invalid values
				leakage: '', // optional boolean -> undefined
				notes: '',
				temperature: 'invalid-temp', // optional numeric -> undefined
				timestamp: '2022-01-01',
			},
			{
				containsStool: 'FALSE',
				containsUrine: 'TRUE',
				diaperBrand: 'Huggies',
				id: '3', // Case-insensitivity and different values
				leakage: 'false',
				notes: 'A bit reddish',
				temperature: '', // optional numeric -> undefined
				timestamp: '2022-01-02',
			},
		];

		const csv = toCsv('diaperChanges', data);
		const parsedData = fromCsv(csv);

		const expectedData = [
			{
				containsStool: false,
				containsUrine: true,
				deviceId: '',
				diaperBrand: 'Pampers',
				diaperProductId: '',
				id: '1',
				leakage: true,
				notes: 'None',
				temperature: 37.5,
				timestamp: '',
			},
			{
				containsStool: false,
				containsUrine: false,
				deviceId: '',
				diaperBrand: '',
				diaperProductId: '',
				id: '2',
				leakage: undefined,
				notes: '',
				temperature: undefined,
				timestamp: '2022-01-01',
			},
			{
				containsStool: false,
				containsUrine: true,
				deviceId: '',
				diaperBrand: 'Huggies',
				diaperProductId: '',
				id: '3',
				leakage: false,
				notes: 'A bit reddish',
				temperature: undefined,
				timestamp: '2022-01-02',
			},
		];

		expect(parsedData).toEqual(expectedData);
	});

	it('maps legacy diaper abnormalities CSV columns to notes', () => {
		const csv =
			'id,containsUrine,containsStool,abnormalities\nlegacy-1,true,false,Legacy notes';

		const parsed = fromCsv(csv);

		expect(parsed).toEqual([
			{
				containsStool: false,
				containsUrine: true,
				id: 'legacy-1',
				notes: 'Legacy notes',
			},
		]);
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

	it('round-trips teething data', () => {
		const data = [
			{
				date: '2026-03-01',
				deviceId: 'device-1',
				id: 'tooth-1',
				notes: 'First visible',
				toothId: '51',
			},
		];

		const csv = toCsv('teething', data);
		const parsedData = fromCsv(csv);

		expect(parsedData).toEqual([
			{
				date: '2026-03-01',
				deviceId: 'device-1',
				id: 'tooth-1',
				notes: 'First visible',
				toothId: 51,
			},
		]);
	});

	it('round-trips profile data including optedOut', () => {
		const data = [
			{
				color: '#22c55e',
				dob: '2024-01-01',
				id: 'profile',
				name: 'Ada',
				optedOut: 'true',
				sex: 'girl',
			},
		];

		const csv = toCsv('profile', data);
		const parsedData = fromCsv(csv);

		expect(parsedData).toEqual([
			{
				color: '#22c55e',
				dob: '2024-01-01',
				id: 'profile',
				name: 'Ada',
				optedOut: true,
				sex: 'girl',
			},
		]);
	});

	it('round-trips app settings and feeding-in-progress values', () => {
		const appSettingsCsv = toCsv('appSettings', [
			{ currency: 'EUR', id: 'appSettings' },
		]);
		const feedingInProgressCsv = toCsv('feedingInProgress', [
			{
				breast: 'left',
				id: 'feedingInProgress',
				startTime: '2026-03-01T10:00:00.000Z',
			},
		]);

		expect(fromCsv(appSettingsCsv)).toEqual([
			{ currency: 'EUR', id: 'appSettings' },
		]);

		expect(fromCsv(feedingInProgressCsv)).toEqual([
			{
				breast: 'left',
				id: 'feedingInProgress',
				startTime: '2026-03-01T10:00:00.000Z',
			},
		]);
	});
});
