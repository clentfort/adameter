import type { FeedingSession } from '@/types/feeding';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import {
	useFeedingSession,
	useFeedingSessionsSnapshot,
	useLatestFeedingSessionRecord,
	useRemoveFeedingSession,
	useUpsertFeedingSession,
} from './use-feeding-sessions';

vi.mock('@/utils/device-id', () => ({
	getDeviceId: () => 'test-device-id',
}));

describe('useFeedingSessions', () => {
	describe('useUpsertFeedingSession', () => {
		it('should create a new feeding session', () => {
			const store = createTestStore();
			const { result } = renderHook(() => useUpsertFeedingSession(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			const newSession = {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:10:00Z',
				id: 'f1',
				startTime: '2024-01-01T10:00:00Z',
			} as FeedingSession;

			act(() => {
				result.current(newSession);
			});

			expect(store.getRow(TABLE_IDS.FEEDING_SESSIONS, 'f1')).toEqual({
				breast: 'left',
				deviceId: 'test-device-id',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:10:00Z',
				startTime: '2024-01-01T10:00:00Z',
				type: 'breast',
			});
		});
	});

	describe('useRemoveFeedingSession', () => {
		it('should remove a feeding session by id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:10:00Z',
				startTime: '2024-01-01T10:00:00Z',
			});

			const { result } = renderHook(() => useRemoveFeedingSession(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current('f1');
			});

			expect(store.hasRow(TABLE_IDS.FEEDING_SESSIONS, 'f1')).toBe(false);
		});
	});

	describe('useFeedingSession', () => {
		it('should return undefined for undefined id', () => {
			const { result } = renderHook(() => useFeedingSession(undefined), {
				wrapper: TinyBaseTestWrapper,
			});
			expect(result.current).toBeUndefined();
		});

		it('should return the feeding session for valid id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:10:00Z',
				startTime: '2024-01-01T10:00:00Z',
			});

			const { result } = renderHook(() => useFeedingSession('f1'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual({
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:10:00Z',
				id: 'f1',
				startTime: '2024-01-01T10:00:00Z',
				type: 'breast',
			});
		});
	});

	describe('useFeedingSessionsSnapshot', () => {
		it('should return all feeding sessions', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:10:00Z',
				startTime: '2024-01-01T10:00:00Z',
			});

			const { result } = renderHook(() => useFeedingSessionsSnapshot(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toHaveLength(1);
			expect(result.current[0].id).toBe('f1');
		});
	});

	describe('useLatestFeedingSessionRecord', () => {
		it('should return the latest feeding session by endTime', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:30:00Z',
				startTime: '2024-01-01T10:20:00Z',
			});
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f2', {
				breast: 'right',
				durationInSeconds: 600,
				endTime: '2024-01-01T11:30:00Z',
				startTime: '2024-01-01T11:20:00Z',
			});

			const { result } = renderHook(() => useLatestFeedingSessionRecord(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current?.id).toBe('f2');
		});
	});
});
