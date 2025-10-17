import { act, renderHook } from '@testing-library/react';
import { subMinutes } from 'date-fns';
import { describe, expect, it, vi } from 'vitest';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import { usePageVisible } from '@/hooks/use-page-visible';
import type { FeedingSession } from '@/types/feeding';
import { useResumableSession } from './use-resumable-session';

vi.mock('@/hooks/use-latest-feeding-session');
vi.mock('@/hooks/use-page-visible');

const mockUseLatestFeedingSession = vi.mocked(useLatestFeedingSession);
const mockUsePageVisible = vi.mocked(usePageVisible);

describe('useResumableSession', () => {
	it('should return undefined when there is no latest feeding session', () => {
		mockUseLatestFeedingSession.mockReturnValue(undefined);
		const { result } = renderHook(() => useResumableSession());
		expect(result.current).toBeUndefined();
	});

	it('should return a resumable session if the latest session ended less than 5 minutes ago', () => {
		const session: FeedingSession = {
			id: '1',
			breast: 'left',
			startTime: new Date().toISOString(),
			endTime: subMinutes(new Date(), 4).toISOString(),
			durationInSeconds: 240,
		};
		mockUseLatestFeedingSession.mockReturnValue(session);
		const { result } = renderHook(() => useResumableSession());
		expect(result.current).toEqual(session);
	});

	it('should return undefined if the latest session ended more than 5 minutes ago', () => {
		const session: FeedingSession = {
			id: '1',
			breast: 'left',
			startTime: new Date().toISOString(),
			endTime: subMinutes(new Date(), 6).toISOString(),
			durationInSeconds: 360,
		};
		mockUseLatestFeedingSession.mockReturnValue(session);
		const { result } = renderHook(() => useResumableSession());
		expect(result.current).toBeUndefined();
	});

	it('should invalidate the session after 5 minutes', () => {
		vi.useFakeTimers();
		let isVisible = true;
		mockUsePageVisible.mockImplementation(() => isVisible);
		const session: FeedingSession = {
			id: '1',
			breast: 'left',
			startTime: new Date().toISOString(),
			endTime: subMinutes(new Date(), 4).toISOString(),
			durationInSeconds: 240,
		};
		mockUseLatestFeedingSession.mockReturnValue(session);
		const { result, rerender } = renderHook(() => useResumableSession());
		expect(result.current).toEqual(session);

		act(() => {
			vi.advanceTimersByTime(60 * 1000);
		});

		isVisible = false;
		rerender();

		isVisible = true;
		rerender();

		expect(result.current).toBeUndefined();
		vi.useRealTimers();
	});
});
