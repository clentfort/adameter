import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MedicationRegimen } from '@/types/medication-regimen';
import { calculateNextDue } from './next-due-calculation';

describe('calculateNextDue', () => {
	const constantDate = new Date('2024-07-22T10:00:00.000Z'); // Monday, 10:00 AM UTC

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(constantDate);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

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

	it('should calculate next due time for daily schedule (later today)', () => {
		const regimen: Partial<MedicationRegimen> = {
			schedule: { times: ['08:00', '12:00', '16:00'], type: 'daily' },
		};
		expect(calculateNextDue(regimen as MedicationRegimen)).toBe(
			'July 22, 2024 12:00 PM',
		);
	});

	it('should calculate next due time for daily schedule (tomorrow)', () => {
		const regimen: Partial<MedicationRegimen> = {
			schedule: { times: ['08:00', '09:00'], type: 'daily' },
		};
		expect(calculateNextDue(regimen as MedicationRegimen)).toBe(
			'July 23, 2024 8:00 AM',
		);
	});
});
