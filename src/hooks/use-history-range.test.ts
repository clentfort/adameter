import { act, renderHook } from '@testing-library/react';
import { addDays, endOfDay, startOfDay, subDays } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useHistoryRange } from './use-history-range';

vi.mock('next/navigation', () => ({
	useRouter: vi.fn(),
	useSearchParams: vi.fn(),
}));

describe('useHistoryRange', () => {
	const mockReplace = vi.fn();
	const mockRouter = { replace: mockReplace };

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	const setup = (
		searchParams: Record<string, string> = {},
		dateKeys: string[] = [],
	) => {
		const params = new URLSearchParams(searchParams);
		vi.mocked(useSearchParams).mockReturnValue(
			params as unknown as ReturnType<typeof useSearchParams>,
		);
		vi.mocked(useRouter).mockReturnValue(
			mockRouter as unknown as ReturnType<typeof useRouter>,
		);

		return renderHook(() => useHistoryRange({ baseUrl: '/test', dateKeys }));
	};

	it('initializes with default 7-day range when no params provided, but DOES NOT sync to URL', () => {
		const now = new Date('2024-01-10T12:00:00Z');
		vi.setSystemTime(now);

		const { result } = setup();

		const expectedEnd = endOfDay(now);
		const expectedStart = startOfDay(subDays(expectedEnd, 6));

		expect(result.current.effectiveRange.from).toEqual(expectedStart);
		expect(result.current.effectiveRange.to).toEqual(expectedEnd);

		// Should NOT sync to URL automatically anymore
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('shows all date keys when no params provided', () => {
		const dateKeys = ['2024-01-20', '2024-01-10', '2024-01-01'];
		const { result } = setup({}, dateKeys);

		expect(result.current.filteredDateKeys).toEqual(dateKeys);
		expect(result.current.historyFilterIndicatorProps.isVisible).toBe(false);
	});

	it('uses range from search params when provided', () => {
		const from = '2024-01-01T00:00:00.000Z';
		const to = '2024-01-05T23:59:59.999Z';

		const { result } = setup({ from, to });

		expect(result.current.effectiveRange.from).toEqual(new Date(from));
		expect(result.current.effectiveRange.to).toEqual(new Date(to));
		expect(result.current.historyFilterIndicatorProps.isVisible).toBe(true);
		expect(mockReplace).not.toHaveBeenCalled();
	});

	it('filters date keys correctly', () => {
		const from = '2024-01-01T00:00:00.000Z';
		const to = '2024-01-05T23:59:59.999Z';
		const dateKeys = [
			'2024-01-06T10:00:00Z',
			'2024-01-05T10:00:00Z',
			'2024-01-03T10:00:00Z',
			'2024-01-01T10:00:00Z',
			'2023-12-31T10:00:00Z',
		];

		const { result } = setup({ from, to }, dateKeys);

		expect(result.current.filteredDateKeys).toEqual([
			'2024-01-05T10:00:00Z',
			'2024-01-03T10:00:00Z',
			'2024-01-01T10:00:00Z',
		]);
	});

	it('correctly identifies if there are more newer or older entries in store', () => {
		const from = '2024-01-01T00:00:00.000Z';
		const to = '2024-01-05T23:59:59.999Z';
		const dateKeys = [
			'2024-01-06T10:00:00Z', // newer
			'2024-01-03T10:00:00Z', // in range
			'2023-12-31T10:00:00Z', // older
		];

		const { result } = setup({ from, to }, dateKeys);

		expect(result.current.hasMoreNewerInStore).toBe(true);
		expect(result.current.hasMoreOlderInStore).toBe(true);
	});

	it('indicator is visible when filtered even if no newer entries', () => {
		const from = '2024-01-01T00:00:00.000Z';
		const to = '2024-01-20T23:59:59.999Z';
		const dateKeys = [
			'2024-01-15T10:00:00Z', // in range
		];

		const { result } = setup({ from, to }, dateKeys);

		expect(result.current.hasMoreNewerInStore).toBe(false);
		expect(result.current.historyFilterIndicatorProps.isVisible).toBe(true);
	});

	it('handles loading more older entries', () => {
		const from = '2024-01-01T00:00:00.000Z';
		const to = '2024-01-05T23:59:59.999Z';

		const { result } = setup({ from, to });

		act(() => {
			result.current.handleLoadMoreOlder();
		});

		const expectedNewFrom = subDays(new Date(from), 7).toISOString();
		const encodedFrom = encodeURIComponent(expectedNewFrom);
		expect(mockReplace).toHaveBeenCalledWith(
			expect.stringContaining(`from=${encodedFrom}`),
			{ scroll: false },
		);
	});

	it('handles loading more newer entries', () => {
		const from = '2024-01-01T00:00:00.000Z';
		const to = '2024-01-05T23:59:59.999Z';

		const { result } = setup({ from, to });

		act(() => {
			result.current.handleLoadMoreNewer();
		});

		const expectedNewTo = endOfDay(addDays(new Date(to), 7)).toISOString();
		const encodedTo = encodeURIComponent(expectedNewTo);
		expect(mockReplace).toHaveBeenCalledWith(
			expect.stringContaining(`to=${encodedTo}`),
			{ scroll: false },
		);
	});
});
