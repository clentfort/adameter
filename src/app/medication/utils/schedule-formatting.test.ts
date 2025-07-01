import { describe, expect, it } from 'vitest';
import { MedicationRegimen } from '@/types/medication-regimen';
import { formatSchedule } from './schedule-formatting';

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
});
