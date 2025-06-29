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
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [],
		});

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
		mockUseDiaperChanges.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [singleChange],
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(singleChange);
	});

	it('should return the latest diaper change when newest is at the end', () => {
		const changes: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				id: '1',
				timestamp: '2023-01-01T10:00:00Z',
			},
			{
				containsStool: true,
				containsUrine: false,
				id: '2',
				timestamp: '2023-01-01T11:00:00Z',
			},
			{
				containsStool: true,
				containsUrine: true,
				id: '3',
				timestamp: '2023-01-01T12:00:00Z',
			}, // Newest
		];
		mockUseDiaperChanges.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: changes,
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(changes[2]);
	});

	it('should return the latest diaper change when newest is at the beginning', () => {
		const changes: DiaperChange[] = [
			{
				containsStool: true,
				containsUrine: true,
				id: '3',
				timestamp: '2023-01-01T12:00:00Z',
			}, // Newest
			{
				containsStool: false,
				containsUrine: true,
				id: '1',
				timestamp: '2023-01-01T10:00:00Z',
			},
			{
				containsStool: true,
				containsUrine: false,
				id: '2',
				timestamp: '2023-01-01T11:00:00Z',
			},
		];
		mockUseDiaperChanges.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: changes,
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(changes[0]);
	});

	it('should return the latest diaper change when newest is in the middle', () => {
		const changes: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				id: '1',
				timestamp: '2023-01-01T10:00:00Z',
			},
			{
				containsStool: true,
				containsUrine: true,
				id: '3',
				timestamp: '2023-01-01T12:00:00Z',
			}, // Newest
			{
				containsStool: true,
				containsUrine: false,
				id: '2',
				timestamp: '2023-01-01T11:00:00Z',
			},
		];
		mockUseDiaperChanges.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: changes,
		});

		const { result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(changes[1]);
	});

	it('should update when diaper changes array reference changes', () => {
		const initialChanges: DiaperChange[] = [
			{
				containsStool: false,
				containsUrine: true,
				id: '1',
				timestamp: '2023-01-01T10:00:00Z',
			},
		];
		const nextChanges: DiaperChange[] = [
			...initialChanges,
			{
				containsStool: true,
				containsUrine: true,
				id: '2',
				timestamp: '2023-01-01T11:00:00Z',
			}, // Newest
		];

		const mockDiaperChangesHook = mockUseDiaperChanges.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: initialChanges,
		});

		const { rerender, result } = renderHook(() => useLatestDiaperChange());
		expect(result.current).toEqual(initialChanges[0]);

		act(() => {
			mockDiaperChangesHook.mockReturnValue({
				add: vi.fn(),
				remove: vi.fn(),
				replace: vi.fn(),
				update: vi.fn(),
				value: nextChanges,
			});
		});
		rerender();

		expect(result.current).toEqual(nextChanges[1]);
	});
});
