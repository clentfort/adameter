import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, MockedFunction, vi } from 'vitest';
import { DiaperChange } from '@/types/diaper';
import { useLatestDiaperChangeRecord } from './use-diaper-changes';
import { useLatestDiaperChange } from './use-latest-diaper-change';

// Mock useLatestDiaperChangeRecord
vi.mock('./use-diaper-changes', () => ({
	useLatestDiaperChangeRecord: vi.fn(),
}));

const mockUseLatestDiaperChangeRecord =
	useLatestDiaperChangeRecord as MockedFunction<
		typeof useLatestDiaperChangeRecord
	>;

describe('useLatestDiaperChange', () => {
	it('should return undefined if there are no diaper changes', () => {
		mockUseLatestDiaperChangeRecord.mockReturnValue(undefined);

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toBeUndefined();
	});

	it('should return the diaper change if there is only one', () => {
		const singleChange: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			id: '1',
			timestamp: '2023-01-01T12:00:00Z',
		};
		mockUseLatestDiaperChangeRecord.mockReturnValue(singleChange);

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(singleChange);
	});

	it('should return the latest diaper change when newest is at the end', () => {
		const latestChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			id: '3',
			timestamp: '2023-01-01T12:00:00Z',
		};
		mockUseLatestDiaperChangeRecord.mockReturnValue(latestChange);

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(latestChange);
	});

	it('should return the latest diaper change when newest is at the beginning', () => {
		const latestChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			id: '3',
			timestamp: '2023-01-01T12:00:00Z',
		};
		mockUseLatestDiaperChangeRecord.mockReturnValue(latestChange);

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(latestChange);
	});

	it('should return the latest diaper change when newest is in the middle', () => {
		const latestChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			id: '3',
			timestamp: '2023-01-01T12:00:00Z',
		};
		mockUseLatestDiaperChangeRecord.mockReturnValue(latestChange);

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(latestChange);
	});

	it('should update when latest diaper change record changes', () => {
		const initialChange: DiaperChange = {
			containsStool: false,
			containsUrine: true,
			id: '1',
			timestamp: '2023-01-01T10:00:00Z',
		};
		const nextChange: DiaperChange = {
			containsStool: true,
			containsUrine: true,
			id: '2',
			timestamp: '2023-01-01T11:00:00Z',
		};

		const mockLatestRecord =
			mockUseLatestDiaperChangeRecord.mockReturnValue(initialChange);

		const { rerender, result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(initialChange);

		act(() => {
			mockLatestRecord.mockReturnValue(nextChange);
		});
		rerender();

		expect(result.current).toEqual(nextChange);
	});
});
