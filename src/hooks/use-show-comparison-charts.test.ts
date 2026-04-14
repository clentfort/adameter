import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import { useShowComparisonCharts } from './use-show-comparison-charts';

vi.mock('@/lib/storage', async (importOriginal) => {
	const original = (await importOriginal()) as typeof import('@/lib/storage');
	return {
		...original,
		getItem: vi.fn(),
		setItem: vi.fn(),
	};
});

describe('useShowComparisonCharts', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should maintain state and update storage correctly', () => {
		// 1. Test default value and initial load
		vi.mocked(getItem).mockReturnValue(null);
		const { rerender, result } = renderHook(() => useShowComparisonCharts());

		expect(result.current[0]).toBe(true);
		expect(getItem).toHaveBeenCalledWith(STORAGE_KEYS.SHOW_COMPARISON_CHARTS);

		// 2. Test updating state and storage
		act(() => {
			result.current[1](false);
		});

		expect(result.current[0]).toBe(false);
		expect(setItem).toHaveBeenCalledWith(
			STORAGE_KEYS.SHOW_COMPARISON_CHARTS,
			'false',
		);

		// 3. Test loading existing value from storage
		vi.mocked(getItem).mockReturnValue('false');
		rerender();
		// Note: The hook only reads from storage on mount (useEffect with []),
		// so we need a fresh mount to test initial load of 'false'.
		const { result: result2 } = renderHook(() => useShowComparisonCharts());
		expect(result2.current[0]).toBe(false);
	});
});
