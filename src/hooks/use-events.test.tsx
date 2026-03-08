import type { Event } from '@/types/event';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { createTestStore, TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import {
	useEvent,
	useEventsSnapshot,
	useRemoveEvent,
	useSortedEventIds,
	useUpsertEvent,
} from './use-events';

vi.mock('@/utils/device-id', () => ({
	getDeviceId: () => 'test-device-id',
}));

describe('useEvents', () => {
	describe('useUpsertEvent', () => {
		it('should create a new event', () => {
			const store = createTestStore();
			const { result } = renderHook(() => useUpsertEvent(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current({
					id: 'e1',
					startDate: '2024-01-01T10:00:00Z',
					title: 'Nap',
					type: 'point',
				} as Event);
			});

			expect(store.getRow(TABLE_IDS.EVENTS, 'e1')).toEqual({
				deviceId: 'test-device-id',
				startDate: '2024-01-01T10:00:00Z',
				title: 'Nap',
				type: 'point',
			});
		});
	});

	describe('useRemoveEvent', () => {
		it('should remove an event', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.EVENTS, 'e1', { type: 'nap' });

			const { result } = renderHook(() => useRemoveEvent(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current('e1');
			});

			expect(store.hasRow(TABLE_IDS.EVENTS, 'e1')).toBe(false);
		});
	});

	describe('useEvent', () => {
		it('should return the event for valid id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.EVENTS, 'e1', { type: 'nap' });

			const { result } = renderHook(() => useEvent('e1'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual({ id: 'e1', type: 'nap' });
		});
	});

	describe('useSortedEventIds', () => {
		it('should return event IDs sorted by startDate descending', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.EVENTS, 'e1', { startDate: '2024-01-01T10:00:00Z' });
			store.setRow(TABLE_IDS.EVENTS, 'e2', { startDate: '2024-01-01T11:00:00Z' });

			const { result } = renderHook(() => useSortedEventIds(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual(['e2', 'e1']);
		});
	});

	describe('useEventsSnapshot', () => {
		it('should return all events', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.EVENTS, 'e1', { type: 'nap' });

			const { result } = renderHook(() => useEventsSnapshot(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toHaveLength(1);
			expect(result.current[0].id).toBe('e1');
		});
	});
});
