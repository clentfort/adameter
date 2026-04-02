import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useLatestFeedingSessionRecord } from '@/hooks/use-feeding-sessions';
import { FeedingSession } from '@/types/feeding';
import { useNextBreast } from './use-next-breast';

vi.mock('@/hooks/use-feeding-sessions', () => ({
	useLatestFeedingSessionRecord: vi.fn(),
}));

describe('useNextBreast', () => {
	it('alternates between breasts based on the latest session record', () => {
		// If last was left, return right
		vi.mocked(useLatestFeedingSessionRecord).mockReturnValue({
			breast: 'left',
			durationInSeconds: 600,
			endTime: new Date().toISOString(),
			id: '1',
			startTime: new Date().toISOString(),
		} as FeedingSession);

		const { result: result1, rerender: rerender1 } = renderHook(() => useNextBreast());
		expect(result1.current).toBe('right');

		// If last was right, return left
		vi.mocked(useLatestFeedingSessionRecord).mockReturnValue({
			breast: 'right',
			durationInSeconds: 600,
			endTime: new Date().toISOString(),
			id: '2',
			startTime: new Date().toISOString(),
		} as FeedingSession);

		const { result: result2 } = renderHook(() => useNextBreast());
		expect(result2.current).toBe('left');

		// If no record, default to left
		vi.mocked(useLatestFeedingSessionRecord).mockReturnValue(undefined);

		const { result: result3 } = renderHook(() => useNextBreast());
		expect(result3.current).toBe('left');
	});
});
