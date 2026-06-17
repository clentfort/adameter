import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLatestDiaperChangeRecord } from '@/hooks/use-diaper-changes';
import { useLastUsedDiaperProduct } from './use-last-used-diaper-product';

vi.mock('@/hooks/use-diaper-changes', () => ({
	useLatestDiaperChangeRecord: vi.fn(),
}));

describe('useLastUsedDiaperProduct', () => {
	it('returns undefined when there is no latest diaper change', () => {
		vi.mocked(useLatestDiaperChangeRecord).mockReturnValue(undefined);

		const { result } = renderHook(() => useLastUsedDiaperProduct());

		expect(result.current).toBeUndefined();
	});

	it('returns diaperProductId from the latest diaper change', () => {
		vi.mocked(useLatestDiaperChangeRecord).mockReturnValue({
			diaperProductId: 'test-product-id',
			id: 'test-id',
			timestamp: '2024-01-01T10:00:00Z',
		} as any);

		const { result } = renderHook(() => useLastUsedDiaperProduct());

		expect(result.current).toBe('test-product-id');
	});

	it('returns undefined if the latest diaper change has no diaperProductId', () => {
		vi.mocked(useLatestDiaperChangeRecord).mockReturnValue({
			id: 'test-id',
			timestamp: '2024-01-01T10:00:00Z',
		} as any);

		const { result } = renderHook(() => useLastUsedDiaperProduct());

		expect(result.current).toBeUndefined();
	});
});
