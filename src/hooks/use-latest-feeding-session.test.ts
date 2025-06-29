import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FeedingSession } from '@/types/feeding';
import { useFeedingSessions } from './use-feeding-sessions';
import { useLatestFeedingSession } from './use-latest-feeding-session';

// Mock useFeedingSessions
vi.mock('./use-feeding-sessions', () => ({
	useFeedingSessions: vi.fn(),
}));

const mockUseFeedingSessions = useFeedingSessions as vi.MockedFunction<
	typeof useFeedingSessions
>;

describe('useLatestFeedingSession', () => {
	it('should return undefined if there are no feeding sessions', () => {
		mockUseFeedingSessions.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [],
		});

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
		mockUseFeedingSessions.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: [singleSession],
		});

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(singleSession);
	});

	it('should return the latest feeding session when newest (by endTime) is at the end', () => {
		const sessions: FeedingSession[] = [
			{
				breast: 'left',
				durationInSeconds: 1800,
				endTime: '2023-01-01T10:00:00Z',
				id: '1',
				startTime: '2023-01-01T09:30:00Z',
			},
			{
				breast: 'right',
				durationInSeconds: 1800,
				endTime: '2023-01-01T11:00:00Z',
				id: '2',
				startTime: '2023-01-01T10:30:00Z',
			},
			{
				breast: 'left',
				durationInSeconds: 1800,
				endTime: '2023-01-01T12:00:00Z',
				id: '3',
				startTime: '2023-01-01T11:30:00Z',
			}, // Latest
		];
		mockUseFeedingSessions.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: sessions,
		});

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(sessions[2]);
	});

	it('should return the latest feeding session when newest (by endTime) is at the beginning', () => {
		const sessions: FeedingSession[] = [
			{
				breast: 'left',
				durationInSeconds: 1800,
				endTime: '2023-01-01T12:00:00Z',
				id: '3',
				startTime: '2023-01-01T11:30:00Z',
			}, // Latest
			{
				breast: 'left',
				durationInSeconds: 1800,
				endTime: '2023-01-01T10:00:00Z',
				id: '1',
				startTime: '2023-01-01T09:30:00Z',
			},
			{
				breast: 'right',
				durationInSeconds: 1800,
				endTime: '2023-01-01T11:00:00Z',
				id: '2',
				startTime: '2023-01-01T10:30:00Z',
			},
		];
		mockUseFeedingSessions.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: sessions,
		});

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(sessions[0]);
	});

	it('should return the latest feeding session when newest (by endTime) is in the middle', () => {
		const sessions: FeedingSession[] = [
			{
				breast: 'left',
				durationInSeconds: 1800,
				endTime: '2023-01-01T10:00:00Z',
				id: '1',
				startTime: '2023-01-01T09:30:00Z',
			},
			{
				breast: 'left',
				durationInSeconds: 1800,
				endTime: '2023-01-01T12:00:00Z',
				id: '3',
				startTime: '2023-01-01T11:30:00Z',
			}, // Latest
			{
				breast: 'right',
				durationInSeconds: 1800,
				endTime: '2023-01-01T11:00:00Z',
				id: '2',
				startTime: '2023-01-01T10:30:00Z',
			},
		];
		mockUseFeedingSessions.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: sessions,
		});

		const { result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(sessions[1]);
	});

	it('should update when feeding sessions array reference changes', () => {
		const initialSessions: FeedingSession[] = [
			{
				breast: 'left',
				durationInSeconds: 1800,
				endTime: '2023-01-01T10:00:00Z',
				id: '1',
				startTime: '2023-01-01T09:30:00Z',
			},
		];
		const nextSessions: FeedingSession[] = [
			...initialSessions,
			{
				breast: 'right',
				durationInSeconds: 1800,
				endTime: '2023-01-01T11:00:00Z',
				id: '2',
				startTime: '2023-01-01T10:30:00Z',
			}, // Latest
		];

		const mockHook = mockUseFeedingSessions.mockReturnValue({
			add: vi.fn(),
			remove: vi.fn(),
			replace: vi.fn(),
			update: vi.fn(),
			value: initialSessions,
		});

		const { rerender, result } = renderHook(() => useLatestFeedingSession());
		expect(result.current).toEqual(initialSessions[0]);

		act(() => {
			mockHook.mockReturnValue({
				add: vi.fn(),
				remove: vi.fn(),
				replace: vi.fn(),
				update: vi.fn(),
				value: nextSessions,
			});
		});
		rerender();

		expect(result.current).toEqual(nextSessions[1]);
	});
});
