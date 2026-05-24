import type { Row } from 'tinybase';
import type { FeedingSession } from '@/types/feeding';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
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

	describe('toFeedingSession', () => {
		it('should warn and return null for invalid data', () => {
			const consoleSpy = vi
				.spyOn(console, 'warn')
				.mockImplementation(() => {});

			// We need to access toFeedingSession but it's not exported.
			// However, useFeedingSession uses it internally.
			const store = createTestStore();
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f-invalid', {
				breast: 'left',
				// missing required fields
			} as Row);

			const { result } = renderHook(() => useFeedingSession('f-invalid'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toBeUndefined();
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining('Invalid feeding session data for id f-invalid'),
				expect.any(Array),
			);

			consoleSpy.mockRestore();
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

		it('should improve coverage by handling multi-profile filtering and invalid records', () => {
			const store = createTestStore();
			vi.spyOn(console, 'warn').mockImplementation(() => {});

			// 1. Multi-profile filtering: record for a different profile
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f-other', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T12:00:00Z',
				profileId: 'other-profile',
				startTime: '2024-01-01T11:50:00Z',
			});

			// 2. Invalid record (missing required fields)
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f-invalid', {
				breast: 'left',
				// missing endTime, startTime, durationInSeconds
			});

			// 3. Valid record for current profile
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f-valid', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:00:00Z',
				profileId: 'main-profile',
				startTime: '2024-01-01T09:50:00Z',
			});

			// Set active profile
			store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'main-profile');

			const { result } = renderHook(() => useLatestFeedingSessionRecord(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			// Should only find the valid one for main-profile
			expect(result.current?.id).toBe('f-valid');

			vi.restoreAllMocks();
		});

		it('should handle missing selectedProfileId', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:30:00Z',
				profileId: 'p1',
				startTime: '2024-01-01T10:20:00Z',
			});

			const { result } = renderHook(() => useLatestFeedingSessionRecord(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current?.id).toBe('f1');
		});

		it('should update latestSession if endTime is greater', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:00:00Z',
				startTime: '2024-01-01T09:50:00Z',
			});
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f2', {
				breast: 'right',
				durationInSeconds: 600,
				endTime: '2024-01-01T11:00:00Z',
				startTime: '2024-01-01T10:50:00Z',
			});

			const { result } = renderHook(() => useLatestFeedingSessionRecord(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current?.id).toBe('f2');
		});

		it('should NOT update latestSession if endTime is smaller', () => {
			const store = createTestStore();
			// f2 is later than f1
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f2', {
				breast: 'right',
				durationInSeconds: 600,
				endTime: '2024-01-01T11:00:00Z',
				startTime: '2024-01-01T10:50:00Z',
			});
			store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'f1', {
				breast: 'left',
				durationInSeconds: 600,
				endTime: '2024-01-01T10:00:00Z',
				startTime: '2024-01-01T09:50:00Z',
			});

			const { result } = renderHook(() => useLatestFeedingSessionRecord(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current?.id).toBe('f2');
		});

		it('should return undefined when no sessions exist', () => {
			const store = createTestStore();
			const { result } = renderHook(() => useLatestFeedingSessionRecord(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toBeUndefined();
		});
	});
});
