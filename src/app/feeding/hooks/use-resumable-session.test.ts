import { act, renderHook } from '@testing-library/react';
import { subMinutes } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import type { FeedingSession } from '@/types/feeding';
import { useResumableSession } from './use-resumable-session';

vi.mock('@/hooks/use-latest-feeding-session');

const mockUseLatestFeedingSession = vi.mocked(useLatestFeedingSession);

describe('useResumableSession', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

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

		act(() => {
			vi.advanceTimersByTime(60 * 1000);
		});

		expect(result.current).toBeUndefined();
	});

	it('should invalidate the session when the page becomes visible and the time has passed', () => {
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

		act(() => {
			vi.advanceTimersByTime(60 * 1000);
		});

		Object.defineProperty(document, 'visibilityState', {
			value: 'visible',
			writable: true,
		});
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
		});

		expect(result.current).toBeUndefined();
	});
});
