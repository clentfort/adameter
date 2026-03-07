import type { FeedingSession } from '@/types/feeding';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, MockedFunction, vi } from 'vitest';
import { useLatestFeedingSessionRecord } from './use-feeding-sessions';
import { useLatestFeedingSession } from './use-latest-feeding-session';

vi.mock('./use-feeding-sessions', () => ({
	useLatestFeedingSessionRecord: vi.fn(),
}));

const mockUseLatestFeedingSessionRecord =
	useLatestFeedingSessionRecord as MockedFunction<
		typeof useLatestFeedingSessionRecord
	>;

describe('useLatestFeedingSession', () => {
	it('should return undefined if there are no feeding sessions', () => {
		mockUseLatestFeedingSessionRecord.mockReturnValue(undefined);

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toBeUndefined();
	});

	it('should return the feeding session if there is only one', () => {
		const singleSession: FeedingSession = {
			breast: 'left',
			durationInSeconds: 1800,
			endTime: '2023-01-01T12:00:00Z',
			id: '1',
			startTime: '2023-01-01T11:30:00Z',
		};

		mockUseLatestFeedingSessionRecord.mockReturnValue(singleSession);

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(singleSession);
	});

	it('should return the latest feeding session when newest is at the end', () => {
		const latestSession: FeedingSession = {
			breast: 'left',
			durationInSeconds: 1800,
			endTime: '2023-01-01T12:00:00Z',
			id: '3',
			startTime: '2023-01-01T11:30:00Z',
		};

		mockUseLatestFeedingSessionRecord.mockReturnValue(latestSession);

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(latestSession);
	});

	it('should return the latest feeding session when newest is at the beginning', () => {
		const latestSession: FeedingSession = {
			breast: 'left',
			durationInSeconds: 1800,
			endTime: '2023-01-01T12:00:00Z',
			id: '3',
			startTime: '2023-01-01T11:30:00Z',
		};

		mockUseLatestFeedingSessionRecord.mockReturnValue(latestSession);

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(latestSession);
	});

	it('should return the latest feeding session when newest is in the middle', () => {
		const latestSession: FeedingSession = {
			breast: 'left',
			durationInSeconds: 1800,
			endTime: '2023-01-01T12:00:00Z',
			id: '3',
			startTime: '2023-01-01T11:30:00Z',
		};

		mockUseLatestFeedingSessionRecord.mockReturnValue(latestSession);

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(latestSession);
	});

	it('should update when the latest feeding session changes', () => {
		const initialSession: FeedingSession = {
			breast: 'left',
			durationInSeconds: 1800,
			endTime: '2023-01-01T10:00:00Z',
			id: '1',
			startTime: '2023-01-01T09:30:00Z',
		};
		const nextSession: FeedingSession = {
			breast: 'right',
			durationInSeconds: 1800,
			endTime: '2023-01-01T11:00:00Z',
			id: '2',
			startTime: '2023-01-01T10:30:00Z',
		};

		const mockHook =
			mockUseLatestFeedingSessionRecord.mockReturnValue(initialSession);

		const { rerender, result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(initialSession);

		act(() => {
			mockHook.mockReturnValue(nextSession);
		});

		rerender();
		expect(result.current).toEqual(nextSession);
	});
});
