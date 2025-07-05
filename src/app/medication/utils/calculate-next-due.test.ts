import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MedicationRegimen } from '@/types/medication-regimen';
import { calculateNextDueTimes } from './calculate-next-due'; // Updated import

const UTC_OFFSET = new Date().getTimezoneOffset(); // Get local timezone offset in minutes
const adjustToUTC = (date: Date) =>
	new Date(date.getTime() + UTC_OFFSET * 60_000);
const adjustToLocal = (date: Date) =>
	new Date(date.getTime() - UTC_OFFSET * 60_000);

// Moved createRegimen to outer scope and refined types
const defaultTestRegimenStartDate = '2024-07-01T00:00:00.000Z';

const createRegimen = (
	overrides: Partial<Omit<MedicationRegimen, 'schedule'>> & { schedule?: import('@/types/medication-regimen').MedicationSchedule } = {},
): MedicationRegimen => {
	const defaults: MedicationRegimen = {
		dosageAmount: 1,
		dosageUnit: 'pill',
		id: 'test-regimen',
		name: 'Test Med',
		prescriber: 'Self',
		schedule: { details: 'N/A', type: 'asNeeded' }, // Default schedule
		startDate: defaultTestRegimenStartDate,
	};

	const { schedule: overrideSchedule, ...otherOverrides } = overrides;

	return {
		...defaults,
		...otherOverrides,
		schedule: overrideSchedule || defaults.schedule, // Use provided schedule or default
	};
};


describe('calculateNextDueTimes', () => {
	// Test reference time: Monday, July 22, 2024, 10:00:00 AM (local time)
	// To make tests stable across timezones, we'll define it in UTC then convert to what local system time would be
	const baseUTCNow = new Date('2024-07-22T10:00:00.000Z');
	let mockNow: Date;

	beforeEach(() => {
		// Set the system time to be the local equivalent of baseUTCNow
		// This ensures that when `new Date()` is called within the tested function (if not passed `now`),
		// or when `startOfDay(now)` is used, it refers to this consistent moment.
		mockNow = adjustToLocal(baseUTCNow);
		vi.useFakeTimers();
		vi.setSystemTime(mockNow);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	// Helper to compare arrays of dates (ignoring milliseconds for safety with some date operations)
	const expectDateArraysToBeClose = (actual: Date[], expected: Date[]) => {
		expect(actual.length).toBe(expected.length);
		for (let i = 0; i < actual.length; i++) {
			// Compare by setting milliseconds to 0 for both
			const actualDate = new Date(actual[i]);
			actualDate.setMilliseconds(0);
			const expectedDate = new Date(expected[i]);
			expectedDate.setMilliseconds(0);
			expect(actualDate.toISOString()).toBe(expectedDate.toISOString());
		}
	};

	it('should return empty array for "asNeeded" schedule', () => {
		const regimen = createRegimen({
			schedule: { details: 'Take as needed', type: 'asNeeded' },
		});
		const result = calculateNextDueTimes(regimen, mockNow);
		expect(result).toEqual([]);
	});

	it('should return empty array if regimen is discontinued', () => {
		const regimen = createRegimen({
			isDiscontinued: true,
			schedule: { times: ['12:00'], type: 'daily' },
		});
		const result = calculateNextDueTimes(regimen, mockNow);
		expect(result).toEqual([]);
	});

	it('should return empty array if regimen end date is in the past', () => {
		const regimen = createRegimen({
			endDate: '2024-07-21T23:59:59.000Z', // Day before mockNow
			schedule: { times: ['12:00'], type: 'daily' },
		});
		const result = calculateNextDueTimes(regimen, mockNow);
		expect(result).toEqual([]);
	});

	it('should return empty array if regimen start date is in the future (beyond lookahead)', () => {
		const regimen = createRegimen({
			schedule: { times: ['12:00'], type: 'daily' },
			startDate: '2024-07-25T00:00:00.000Z', // 3 days after mockNow
		});
		const result = calculateNextDueTimes(regimen, mockNow, 2); // Default lookahead
		expect(result).toEqual([]);
	});

	it('should return times if regimen start date is in the future but within lookahead', () => {
		const regimen = createRegimen({
			schedule: { times: ['08:00'], type: 'daily' },
			startDate: '2024-07-23T00:00:00.000Z', // Tomorrow
		});
		// lookaheadDays = 3. iterationEndDate = startOfDay(July 25)
		// Expected: July 23 08:00, July 24 08:00
		const result = calculateNextDueTimes(regimen, mockNow, 3);
		const expectedTimes: Date[] = [
			new Date('2024-07-23T08:00:00.000Z'),
			new Date('2024-07-24T08:00:00.000Z'),
		].map(adjustToLocal);
		expectDateArraysToBeClose(result, expectedTimes);
	});

	describe('Daily Schedule', () => {
		it('should calculate next due times for daily schedule (later today and tomorrow)', () => {
			const regimen = createRegimen({
				schedule: { times: ['08:00', '12:00', '16:00'], type: 'daily' },
				startDate: '2024-07-22T00:00:00.000Z', // Today
			});
			// lookaheadDays = 2. iterationEndDate = startOfDay(July 24)
			const result = calculateNextDueTimes(regimen, mockNow, 2);

			const expectedTimes: Date[] = [
				new Date('2024-07-22T12:00:00.000Z'),
				new Date('2024-07-22T16:00:00.000Z'),
				new Date('2024-07-23T08:00:00.000Z'),
				new Date('2024-07-23T12:00:00.000Z'),
				new Date('2024-07-23T16:00:00.000Z'),
			].map(adjustToLocal);
			expectDateArraysToBeClose(result, expectedTimes);
		});

		it('should calculate next due time for daily schedule (only tomorrow if all today passed)', () => {
			const regimen = createRegimen({
				schedule: { times: ['08:00', '09:00'], type: 'daily' },
				startDate: '2024-07-22T00:00:00.000Z',
			});
			// mockNow is 10:00 AM. lookaheadDays = 2. iterationEndDate = startOfDay(July 24)
			const result = calculateNextDueTimes(regimen, mockNow, 2);
			const expectedTimes: Date[] = [
				new Date('2024-07-23T08:00:00.000Z'),
				new Date('2024-07-23T09:00:00.000Z'),
			].map(adjustToLocal);
			expectDateArraysToBeClose(result, expectedTimes);
		});

		it('should respect regimen endDate for daily schedule', () => {
			const regimen = createRegimen({
				endDate: '2024-07-22T14:00:00.000Z', // Ends today at 2 PM (exclusive for time part)
				schedule: { times: ['12:00', '16:00'], type: 'daily' },
				startDate: '2024-07-22T00:00:00.000Z',
			});
			// lookaheadDays = 2. overallLookaheadBoundary = startOfDay(July 24)
			// regimenEndDate is July 22 14:00. iterationEndDate = July 22 14:00
			const result = calculateNextDueTimes(regimen, mockNow, 2);
			const expectedTimes: Date[] = [new Date('2024-07-22T12:00:00.000Z')].map(
				adjustToLocal,
			);
			expectDateArraysToBeClose(result, expectedTimes);
		});

		it('should return empty if no daily times scheduled', () => {
			const regimen = createRegimen({ schedule: { times: [], type: 'daily' } });
			const result = calculateNextDueTimes(regimen, mockNow);
			expect(result).toEqual([]);
		});
	});

	describe('Interval Schedule', () => {
		it('should calculate next due times for interval schedule (hours)', () => {
			const regimen = createRegimen({
				schedule: {
					firstDoseTime: '06:00', // 8hr interval: 06, 14, 22
					intervalUnit: 'hours',
					intervalValue: 8,
					type: 'interval',
				},
				startDate: '2024-07-21T00:00:00.000Z',
			});
			// mockNow is July 22 10:00. lookaheadDays = 3. iterationEndDate = startOfDay(July 25)
			const result = calculateNextDueTimes(regimen, mockNow, 3);
			const expectedTimes: Date[] = [
				// Expected for July 22, 23, 24
				new Date('2024-07-22T14:00:00.000Z'), // after now
				new Date('2024-07-22T22:00:00.000Z'),
				new Date('2024-07-23T06:00:00.000Z'),
				new Date('2024-07-23T14:00:00.000Z'),
				new Date('2024-07-23T22:00:00.000Z'),
				new Date('2024-07-24T06:00:00.000Z'),
				new Date('2024-07-24T14:00:00.000Z'),
				new Date('2024-07-24T22:00:00.000Z'), // This one was missing
			].map(adjustToLocal);
			expectDateArraysToBeClose(result, expectedTimes);
		});

		it('should calculate next due times for interval schedule (days)', () => {
			const regimen = createRegimen({
				schedule: {
					firstDoseTime: '09:00', // Every 1 day
					intervalUnit: 'days',
					intervalValue: 1,
					type: 'interval',
				},
				startDate: '2024-07-20T00:00:00.000Z',
			});
			// mockNow is July 22 10:00. lookaheadDays = 3. iterationEndDate = startOfDay(July 25)
			// Doses: July 20 09:00, July 21 09:00, July 22 09:00 (all past or before now)
			// Next: July 23 09:00, July 24 09:00
			const result = calculateNextDueTimes(regimen, mockNow, 3);
			const expectedTimes: Date[] = [
				new Date('2024-07-23T09:00:00.000Z'),
				new Date('2024-07-24T09:00:00.000Z'),
			].map(adjustToLocal);
			expectDateArraysToBeClose(result, expectedTimes);
		});

		it('should respect regimen endDate for interval schedule', () => {
			const regimen = createRegimen({
				endDate: '2024-07-23T12:00:00.000Z', // Ends July 23 at 12 PM (exclusive)
				schedule: {
					firstDoseTime: '08:00', // 6hr interval: 08, 14, 20
					intervalUnit: 'hours',
					intervalValue: 6,
					type: 'interval',
				},
				startDate: '2024-07-22T00:00:00.000Z',
			});
			// mockNow is July 22 10:00. lookaheadDays = 3. overallLookaheadBoundary = startOfDay(July 25)
			// iterationEndDate = min(startOfDay(July 25), July 23 12:00) = July 23 12:00
			const result = calculateNextDueTimes(regimen, mockNow, 3);
			const expectedTimes: Date[] = [
				// Times before July 23 12:00
				new Date('2024-07-22T14:00:00.000Z'),
				new Date('2024-07-22T20:00:00.000Z'),
				new Date('2024-07-23T02:00:00.000Z'),
				new Date('2024-07-23T08:00:00.000Z'),
			].map(adjustToLocal);
			expectDateArraysToBeClose(result, expectedTimes);
		});

		it('should handle interval start time being after "now" on the first day', () => {
			const regimen = createRegimen({
				schedule: {
					firstDoseTime: '14:00', // Starts today at 2 PM (after mockNow 10 AM)
					intervalUnit: 'hours', // 6hr interval: 14:00, 20:00
					intervalValue: 6,
					type: 'interval',
				},
				startDate: '2024-07-22T00:00:00.000Z',
			});
			// lookaheadDays = 2. iterationEndDate = startOfDay(July 24)
			const result = calculateNextDueTimes(regimen, mockNow, 2);
			const expectedTimes: Date[] = [
				// For July 22, July 23
				new Date('2024-07-22T14:00:00.000Z'),
				new Date('2024-07-22T20:00:00.000Z'),
				new Date('2024-07-23T02:00:00.000Z'),
				new Date('2024-07-23T08:00:00.000Z'),
				new Date('2024-07-23T14:00:00.000Z'),
				new Date('2024-07-23T20:00:00.000Z'),
			].map(adjustToLocal);
			expectDateArraysToBeClose(result, expectedTimes);
		});
	});

	describe('Weekly Schedule', () => {
		// mockNow is Monday, July 22, 2024, 10:00:00 AM
		it('should calculate next due times for weekly schedule (this week and next)', () => {
			const regimen = createRegimen({
				schedule: {
					daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
					times: ['09:00', '17:00'],
					type: 'weekly',
				},
				startDate: '2024-07-01T00:00:00.000Z',
			});
			// lookaheadDays = 7. iterationEndDate = startOfDay(July 29)
			const result = calculateNextDueTimes(regimen, mockNow, 7);
			const expectedTimes: Date[] = [
				// Mon(1), Wed(2), Fri(2) for current week
				new Date('2024-07-22T17:00:00.000Z'),
				new Date('2024-07-24T09:00:00.000Z'),
				new Date('2024-07-24T17:00:00.000Z'),
				new Date('2024-07-26T09:00:00.000Z'),
				new Date('2024-07-26T17:00:00.000Z'),
			].map(adjustToLocal);
			expectDateArraysToBeClose(result, expectedTimes);
		});

		it('should respect regimen endDate for weekly schedule', () => {
			const regimen = createRegimen({
				endDate: '2024-07-25T23:59:59.000Z', // Regimen ends end of day Thurs, July 25
				schedule: {
					daysOfWeek: ['Monday', 'Wednesday', 'Friday'], // Fri is out
					times: ['09:00', '17:00'],
					type: 'weekly',
				},
				startDate: '2024-07-01T00:00:00.000Z',
			});
			// lookaheadDays = 7. overallLookaheadBoundary = startOfDay(July 29)
			// regimenEndDate is July 25 23:59:59Z.
			// iterationEndDate = min(startOfDay(July 29), July 25 23:59:59Z) effectively startOfDay(July 26)
			const result = calculateNextDueTimes(regimen, mockNow, 7);
			const expectedTimes: Date[] = [
				// Mon, Wed this week. Friday is outside regimen end.
				new Date('2024-07-22T17:00:00.000Z'),
				new Date('2024-07-24T09:00:00.000Z'),
				new Date('2024-07-24T17:00:00.000Z'),
			].map(adjustToLocal);
			expectDateArraysToBeClose(result, expectedTimes);
		});

		it('should return empty if no weekly days or times scheduled', () => {
			const regimen1 = createRegimen({
				schedule: { daysOfWeek: [], times: ['09:00'], type: 'weekly' },
			});
			expect(calculateNextDueTimes(regimen1, mockNow)).toEqual([]);

			const regimen2 = createRegimen({
				schedule: { daysOfWeek: ['Monday'], times: [], type: 'weekly' },
			});
			expect(calculateNextDueTimes(regimen2, mockNow)).toEqual([]);
		});

		it('should handle weekly schedule spanning across year end (if date-fns handles it)', () => {
			const dec30UTC = new Date('2024-12-30T10:00:00Z'); // Monday
			const dec30Local = adjustToLocal(dec30UTC);
			vi.setSystemTime(dec30Local);

			const regimen = createRegimen({
				schedule: {
					daysOfWeek: ['Monday', 'Wednesday'],
					times: ['14:00'],
					type: 'weekly',
				},
				startDate: '2024-12-01T00:00:00.000Z',
			});
			// lookaheadDays = 7. iterationEndDate = startOfDay(Jan 6, 2025)
			const result = calculateNextDueTimes(regimen, dec30Local, 7);
			const expectedTimes: Date[] = [
				// Mon Dec 30, Wed Jan 1. Mon Jan 6 is excluded.
				new Date('2024-12-30T14:00:00.000Z'),
				new Date('2025-01-01T14:00:00.000Z'),
			].map((d) => adjustToLocal(d));
			expectDateArraysToBeClose(result, expectedTimes);
		});
	});
});
