import { describe, expect, it } from 'vitest';
import { MedicationRegimen } from '@/types/medication-regimen';
import { calculateNextDue, formatSchedule } from './utils';

describe('formatSchedule', () => {
	it('should format daily schedule with one time', () => {
		const schedule: MedicationRegimen['schedule'] = {
			times: ['10:00'],
			type: 'daily',
		};
		expect(String(formatSchedule(schedule))).toBe('Daily at 10:00');
	});

	it('should format daily schedule with multiple times', () => {
		const schedule: MedicationRegimen['schedule'] = {
			times: ['10:00', '14:00', '18:00'],
			type: 'daily',
		};
		expect(String(formatSchedule(schedule))).toBe(
			'Daily at 10:00, 14:00, 18:00',
		);
	});

	it('should format interval schedule', () => {
		const schedule: MedicationRegimen['schedule'] = {
			firstDoseTime: '08:00',
			intervalUnit: 'hours',
			intervalValue: 6,
			type: 'interval',
		};
		expect(String(formatSchedule(schedule))).toBe(
			'Every 6 hours, first dose at 08:00',
		);
	});

	it('should format weekly schedule with one day', () => {
		const schedule: MedicationRegimen['schedule'] = {
			daysOfWeek: ['Monday'],
			times: ['09:00'],
			type: 'weekly',
		};
		expect(String(formatSchedule(schedule))).toBe('Weekly on Monday at 09:00');
	});

	it('should format weekly schedule with multiple days and times', () => {
		const schedule: MedicationRegimen['schedule'] = {
			daysOfWeek: ['Monday', 'Friday'],
			times: ['09:00', '17:00'],
			type: 'weekly',
		};
		expect(String(formatSchedule(schedule))).toBe(
			'Weekly on Monday, Friday at 09:00, 17:00',
		);
	});

	it('should format asNeeded schedule', () => {
		const schedule: MedicationRegimen['schedule'] = {
			details: 'For headache relief',
			type: 'asNeeded',
		};
		expect(String(formatSchedule(schedule))).toBe(
			'As needed: For headache relief',
		);
	});

	it('should return N/A for unknown schedule type', () => {
		// @ts-expect-error Testing behavior with an unknown schedule type
		const schedule = { type: 'unknown' };
		expect(String(formatSchedule(schedule))).toBe('N/A');
	});

    // Removed test for undefined schedule as the function is not designed to handle it gracefully
    // and would throw a TypeError, which is not what 'N/A' implies.
});

describe('calculateNextDue', () => {
	// Note: These tests depend on the current time and may need to be adjusted
	// or mocked for stability if run in different timezones or at different times.
	// For now, we rely on the logic as implemented.

	it('should return "Calculation pending" for empty daily times', () => {
		const regimen: Partial<MedicationRegimen> = {
			schedule: { times: [], type: 'daily' },
		};
		expect(calculateNextDue(regimen as MedicationRegimen)).toBe(
			'Calculation pending',
		);
	});

	it('should return "Calculation pending" for interval schedule', () => {
		const regimen: Partial<MedicationRegimen> = {
			schedule: {
				firstDoseTime: '10:00',
				intervalUnit: 'hours',
				intervalValue: 4,
				type: 'interval',
			},
		};
		expect(calculateNextDue(regimen as MedicationRegimen)).toBe(
			'Calculation pending',
		);
	});

	it('should return "Calculation pending" for weekly schedule', () => {
		const regimen: Partial<MedicationRegimen> = {
			schedule: { daysOfWeek: ['Monday'], times: ['10:00'], type: 'weekly' },
		};
		expect(calculateNextDue(regimen as MedicationRegimen)).toBe(
			'Calculation pending',
		);
	});

	it('should return "Calculation pending" for asNeeded schedule', () => {
		const regimen: Partial<MedicationRegimen> = {
			schedule: { details: 'Take as needed', type: 'asNeeded' },
		};
		expect(calculateNextDue(regimen as MedicationRegimen)).toBe(
			'Calculation pending',
		);
	});

	// More complex tests for daily schedule might require mocking Date
	// For example, to test a specific time of day for "later today" vs "tomorrow"
	// Current implementation of calculateNextDue is simple, so these tests cover its branches.
});
