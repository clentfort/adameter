import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DiaperChange } from '@/types/diaper';
import { useDiaperChanges } from './use-diaper-changes';
import { useLatestDiaperChange } from './use-latest-diaper-change';

// Mock useDiaperChanges
vi.mock('./use-diaper-changes', () => ({
	useDiaperChanges: vi.fn(),
}));

const mockUseDiaperChanges = useDiaperChanges as vi.MockedFunction<
	typeof useDiaperChanges
>;

describe('useLatestDiaperChange', () => {
	it('should return undefined if there are no diaper changes', () => {
		mockUseDiaperChanges.mockReturnValue({
			value: [],
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toBeUndefined();
	});

	it('should return the diaper change if there is only one', () => {
		const singleChange: DiaperChange = {
			id: '1',
			timestamp: '2023-01-01T12:00:00Z',
			containsUrine: true,
			containsStool: false,
		};
		mockUseDiaperChanges.mockReturnValue({
			value: [singleChange],
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(singleChange);
	});

	it('should return the latest diaper change when newest is at the end', () => {
		const changes: DiaperChange[] = [
			{
				id: '1',
				timestamp: '2023-01-01T10:00:00Z',
				containsUrine: true,
				containsStool: false,
			},
			{
				id: '2',
				timestamp: '2023-01-01T11:00:00Z',
				containsUrine: false,
				containsStool: true,
			},
			{
				id: '3',
				timestamp: '2023-01-01T12:00:00Z',
				containsUrine: true,
				containsStool: true,
			}, // Newest
		];
		mockUseDiaperChanges.mockReturnValue({
			value: changes,
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(changes[2]);
	});

	it('should return the latest diaper change when newest is at the beginning', () => {
		const changes: DiaperChange[] = [
			{
				id: '3',
				timestamp: '2023-01-01T12:00:00Z',
				containsUrine: true,
				containsStool: true,
			}, // Newest
			{
				id: '1',
				timestamp: '2023-01-01T10:00:00Z',
				containsUrine: true,
				containsStool: false,
			},
			{
				id: '2',
				timestamp: '2023-01-01T11:00:00Z',
				containsUrine: false,
				containsStool: true,
			},
		];
		mockUseDiaperChanges.mockReturnValue({
			value: changes,
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(changes[0]);
	});

	it('should return the latest diaper change when newest is in the middle', () => {
		const changes: DiaperChange[] = [
			{
				id: '1',
				timestamp: '2023-01-01T10:00:00Z',
				containsUrine: true,
				containsStool: false,
			},
			{
				id: '3',
				timestamp: '2023-01-01T12:00:00Z',
				containsUrine: true,
				containsStool: true,
			}, // Newest
			{
				id: '2',
				timestamp: '2023-01-01T11:00:00Z',
				containsUrine: false,
				containsStool: true,
			},
		];
		mockUseDiaperChanges.mockReturnValue({
			value: changes,
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(changes[1]);
	});

	it('should update when diaper changes array reference changes', () => {
		const initialChanges: DiaperChange[] = [
			{
				id: '1',
				timestamp: '2023-01-01T10:00:00Z',
				containsUrine: true,
				containsStool: false,
			},
		];
		const nextChanges: DiaperChange[] = [
			...initialChanges,
			{
				id: '2',
				timestamp: '2023-01-01T11:00:00Z',
				containsUrine: true,
				containsStool: true,
			}, // Newest
		];

		const mockDiaperChangesHook = mockUseDiaperChanges.mockReturnValue({
			value: initialChanges,
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
		});

		const { result, rerender } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(initialChanges[0]);

		act(() => {
			mockDiaperChangesHook.mockReturnValue({
				value: nextChanges,
				add: vi.fn(),
				remove: vi.fn(),
				replace: vi.fn(),
				update: vi.fn(),
			});
		});
		rerender();

		expect(result.current).toEqual(nextChanges[1]);
	});
});
