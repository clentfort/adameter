import { act, renderHook } from '@testing-library/react';
import { addMinutes, formatISO } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Import the function directly, it will be the mocked version
import { calculateNextDueTimes } from '@/app/medication/utils/calculate-next-due';
import { MedicationAdministration } from '@/types/medication';
import { MedicationRegimen } from '@/types/medication-regimen';
import { useDueMedications } from './use-due-medications';
import { useMedicationRegimens } from './use-medication-regimens';
import { useMedications } from './use-medications';

// Mock dependencies
vi.mock('./use-medication-regimens');
vi.mock('./use-medications');
// Mock for calculateNextDueTimes: vi.fn() will be assigned to the named export
vi.mock('@/app/medication/utils/calculate-next-due', async () => ({
    calculateNextDueTimes: vi.fn(),
}));


const mockUseMedicationRegimens = useMedicationRegimens as vi.MockedFunction<
	typeof useMedicationRegimens
>;
const mockUseMedications = useMedications as vi.MockedFunction<
	typeof useMedications
>;
// Cast the imported (and mocked) function
const mockCalculateNextDueTimes = calculateNextDueTimes as vi.MockedFunction<typeof calculateNextDueTimes>;


// Moved createRegimen to outer scope
const createRegimen = (
	id: string,
	name: string,
	scheduleType: 'daily' | 'asNeeded' | 'interval' | 'weekly' = 'daily',
	isDiscontinued = false,
): MedicationRegimen => ({
	dosageAmount: 1,
	dosageUnit: 'pill',
	id,
	isDiscontinued,
	name,
	prescriber: 'Self',
	schedule:
		scheduleType === 'daily'
			? { times: ['10:05'], type: 'daily' } // Default to a time that would be "due"
			: { details: 'as needed', type: 'asNeeded' },
	startDate: '2024-07-01T00:00:00.000Z',
});

describe('useDueMedications', () => {
	const baseTime = new Date('2024-07-25T10:00:00.000Z'); // Use a fixed base time for "now"

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(baseTime);
		mockCalculateNextDueTimes.mockClear(); // Clear mock before each test
		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [],
		});
		mockUseMedications.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [],
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return empty array if no regimens', () => {
		const { result } = renderHook(() => useDueMedications());
		expect(result.current).toEqual([]);
	});

	it('should return empty array for "asNeeded" regimens', () => {
		const regimen1 = createRegimen('reg1', 'Med A', 'asNeeded');
		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [regimen1],
		});

		const { result } = renderHook(() => useDueMedications());
		expect(result.current).toEqual([]);
		expect(mockCalculateNextDueTimes).not.toHaveBeenCalledWith(
			regimen1,
			expect.anything(),
			expect.anything(),
		);
	});

	it('should return empty array if regimen is discontinued', () => {
		const regimen1 = createRegimen('reg1', 'Med A', 'daily', true);
		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [regimen1],
		});

		const { result } = renderHook(() => useDueMedications());
		expect(result.current).toEqual([]);
		expect(mockCalculateNextDueTimes).not.toHaveBeenCalledWith(
			regimen1,
			expect.anything(),
			expect.anything(),
		);
	});

	it('should identify a medication as due if scheduled within the window and not administered', () => {
		const regimen1 = createRegimen('reg1', 'Med A'); // schedule time 10:05
		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [regimen1],
		});

		const scheduledDueTime = new Date('2024-07-25T10:05:00.000Z'); // 5 mins from baseTime
		mockCalculateNextDueTimes.mockReturnValue([scheduledDueTime]);

		const { result } = renderHook(() => useDueMedications());

		expect(mockCalculateNextDueTimes).toHaveBeenCalledWith(
			regimen1,
			baseTime,
			1,
		);
		expect(result.current.length).toBe(1);
		expect(result.current[0].regimen.id).toBe('reg1');
		expect(result.current[0].dueTime.toISOString()).toBe(
			scheduledDueTime.toISOString(),
		);
	});

	it('should NOT identify a medication as due if scheduled time is outside the ±10min window', () => {
		const regimen1 = createRegimen('reg1', 'Med A');
		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [regimen1],
		});

		// Scheduled 15 mins from baseTime (10:00), so at 10:15
		const scheduledDueTime = addMinutes(baseTime, 15);
		mockCalculateNextDueTimes.mockReturnValue([scheduledDueTime]);

		const { result } = renderHook(() => useDueMedications());
		expect(result.current.length).toBe(0);
	});

	it('should NOT identify a medication as due if it was recently administered for that slot', () => {
		const regimen1 = createRegimen('reg1', 'Med A');
		const scheduledDueTime = new Date('2024-07-25T10:05:00.000Z'); // 5 mins from baseTime

		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [regimen1],
		});
		mockCalculateNextDueTimes.mockReturnValue([scheduledDueTime]);

		const administration: MedicationAdministration = {
			administrationStatus: 'On Time',
			dosageAmount: 1,
			dosageUnit: 'pill',
			id: 'admin1',
			medicationName: 'Med A',
			regimenId: 'reg1',
			timestamp: formatISO(addMinutes(scheduledDueTime, 1)), // Administered 1 min after scheduled
		};
		mockUseMedications.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [administration],
		});

		const { result } = renderHook(() => useDueMedications());
		expect(result.current.length).toBe(0);
	});

	it('SHOULD identify a medication as due if administered time is outside the RECENTLY_ADMINISTERED_WINDOW_MINUTES for that slot', () => {
		const regimen1 = createRegimen('reg1', 'Med A');
		const scheduledDueTime = new Date('2024-07-25T10:05:00.000Z');

		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [regimen1],
		});
		mockCalculateNextDueTimes.mockReturnValue([scheduledDueTime]);

		const administration: MedicationAdministration = {
			dosageAmount: 1,
			dosageUnit: 'pill',
			id: 'admin1',
			medicationName: 'Med A',
			regimenId: 'reg1',
			// Administered 35 mins after scheduled time (default RECENTLY_ADMINISTERED_WINDOW_MINUTES is 30)
			administrationStatus: 'On Time',
			timestamp: formatISO(addMinutes(scheduledDueTime, 35)),
		};
		mockUseMedications.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [administration],
		});

		const { result } = renderHook(() => useDueMedications());
		expect(result.current.length).toBe(1);
		expect(result.current[0].regimen.id).toBe('reg1');
	});

	it('should handle multiple due medications and multiple administrations', () => {
		const regimen1 = createRegimen('reg1', 'Med A'); // Due at 10:05
		const regimen2 = createRegimen('reg2', 'Med B'); // Due at 10:08
		const regimen3 = createRegimen('reg3', 'Med C'); // Due at 09:55

		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [regimen1, regimen2, regimen3],
		});

		const dueTime1 = new Date('2024-07-25T10:05:00.000Z');
		const dueTime2 = new Date('2024-07-25T10:08:00.000Z');
		const dueTime3 = new Date('2024-07-25T09:55:00.000Z');

		mockCalculateNextDueTimes.mockImplementation((reg: MedicationRegimen) => {
			if (reg.id === 'reg1') return [dueTime1];
			if (reg.id === 'reg2') return [dueTime2];
			if (reg.id === 'reg3') return [dueTime3];
			return [];
		});

		const adminForReg2: MedicationAdministration = {
			administrationStatus: 'On Time',
			dosageAmount: 1,
			dosageUnit: 'pill',
			id: 'admin-reg2',
			medicationName: 'Med B',
			regimenId: 'reg2',
			timestamp: formatISO(dueTime2), // Administered exactly on time
		};
		mockUseMedications.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [adminForReg2],
		});

		const { result } = renderHook(() => useDueMedications());

		expect(result.current.length).toBe(2);
		expect(result.current.some((d) => d.regimen.id === 'reg1')).toBe(true);
		expect(result.current.some((d) => d.regimen.id === 'reg3')).toBe(true);
		expect(result.current.some((d) => d.regimen.id === 'reg2')).toBe(false);
	});

	it('should update due medications when currentTime changes via timer', () => {
		const regimen1 = createRegimen('reg1', 'Med A');
		mockUseMedicationRegimens.mockReturnValue({
			add: vi.fn(),
			error: null,
			loading: false,
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [regimen1],
		});

		// Initially, this time is NOT due (10:11 is > 10 mins from 10:00)
		const scheduledTime = new Date('2024-07-25T10:11:00.000Z');
		mockCalculateNextDueTimes.mockReturnValue([scheduledTime]);

		const { rerender, result } = renderHook(() => useDueMedications());
		expect(result.current.length).toBe(0); // Not due at 10:00

		// Advance time by 1 minute. Now current time is 10:01.
		// 10:11 is now within 10 minutes of 10:01.
		act(() => {
			vi.setSystemTime(new Date('2024-07-25T10:01:00.000Z'));
			vi.advanceTimersByTime(60_000); // Trigger the hook's internal interval
		});
		// rerender(); // Not strictly necessary due to act

		// mockCalculateNextDueTimes should be called with the new current time, which is 10:01 (setSystemTime) + 1min (advanceTimersByTime) = 10:02
		expect(mockCalculateNextDueTimes).toHaveBeenLastCalledWith(
			regimen1,
			new Date('2024-07-25T10:02:00.000Z'),
			1,
		);
		expect(result.current.length).toBe(1);
		expect(result.current[0].regimen.id).toBe('reg1');
	});
});
