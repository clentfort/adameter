import type { DiaperChange } from '@/types/diaper';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import {
	useDiaperChange,
	useDiaperChangesSnapshot,
	useLatestDiaperChangeRecord,
	useRemoveDiaperChange,
	useUpsertDiaperChange,
} from './use-diaper-changes';

// Mock getDeviceId
vi.mock('@/utils/device-id', () => ({
	getDeviceId: () => 'test-device-id',
}));

describe('useDiaperChanges', () => {
	describe('useUpsertDiaperChange', () => {
		it('should create a new diaper change', () => {
			const store = createTestStore();
			const { result } = renderHook(() => useUpsertDiaperChange(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			const newChange = {
				containsStool: false,
				containsUrine: true,
				id: 'd1',
				timestamp: '2024-01-01T10:00:00Z',
			} as DiaperChange;

			act(() => {
				result.current(newChange);
			});

			expect(store.getRow(TABLE_IDS.DIAPER_CHANGES, 'd1')).toEqual({
				containsStool: false,
				containsUrine: true,
				deviceId: 'test-device-id',
				timestamp: '2024-01-01T10:00:00Z',
			});
		});

		it('should update an existing diaper change', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
				containsUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			});

			const { result } = renderHook(() => useUpsertDiaperChange(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current({
					containsStool: true,
					containsUrine: true,
					id: 'd1',
					timestamp: '2024-01-01T10:00:00Z',
				} as DiaperChange);
			});

			expect(store.getRow(TABLE_IDS.DIAPER_CHANGES, 'd1')).toEqual({
				containsStool: true,
				containsUrine: true,
				deviceId: 'test-device-id',
				timestamp: '2024-01-01T10:00:00Z',
			});
		});
	});

	describe('useRemoveDiaperChange', () => {
		it('should remove a diaper change by id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
				containsUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			});

			const { result } = renderHook(() => useRemoveDiaperChange(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current('d1');
			});

			expect(store.hasRow(TABLE_IDS.DIAPER_CHANGES, 'd1')).toBe(false);
		});
	});

	describe('useDiaperChange', () => {
		it('should return undefined for undefined id', () => {
			const { result } = renderHook(() => useDiaperChange(undefined), {
				wrapper: TinyBaseTestWrapper,
			});
			expect(result.current).toBeUndefined();
		});

		it('should return undefined for non-existent id', () => {
			const { result } = renderHook(() => useDiaperChange('non-existent'), {
				wrapper: TinyBaseTestWrapper,
			});
			expect(result.current).toBeUndefined();
		});

		it('should return the diaper change for valid id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
				containsStool: false,
				containsUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			});

			const { result } = renderHook(() => useDiaperChange('d1'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual({
				containsStool: false,
				containsUrine: true,
				id: 'd1',
				timestamp: '2024-01-01T10:00:00Z',
			});
		});
	});

	describe('useDiaperChangesSnapshot', () => {
		it('should return empty array when no changes exist', () => {
			const { result } = renderHook(() => useDiaperChangesSnapshot(), {
				wrapper: TinyBaseTestWrapper,
			});
			expect(result.current).toEqual([]);
		});

		it('should return all diaper changes', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
				containsStool: false,
				containsUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			});
			store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd2', {
				containsStool: false,
				containsUrine: true,
				timestamp: '2024-01-01T11:00:00Z',
			});

			const { result } = renderHook(() => useDiaperChangesSnapshot(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toHaveLength(2);
			expect(result.current).toContainEqual({
				containsStool: false,
				containsUrine: true,
				id: 'd1',
				timestamp: '2024-01-01T10:00:00Z',
			});
			expect(result.current).toContainEqual({
				containsStool: false,
				containsUrine: true,
				id: 'd2',
				timestamp: '2024-01-01T11:00:00Z',
			});
		});

		it('should update when changes are added/removed', () => {
			const store = createTestStore();
			const { result } = renderHook(() => useDiaperChangesSnapshot(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual([]);

			act(() => {
				store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
					containsStool: false,
					containsUrine: true,
					timestamp: '2024-01-01T10:00:00Z',
				});
			});

			expect(result.current).toHaveLength(1);

			act(() => {
				store.delRow(TABLE_IDS.DIAPER_CHANGES, 'd1');
			});

			expect(result.current).toEqual([]);
		});
	});

	describe('useLatestDiaperChangeRecord', () => {
		it('should return undefined when no changes exist', () => {
			const { result } = renderHook(() => useLatestDiaperChangeRecord(), {
				wrapper: TinyBaseTestWrapper,
			});
			expect(result.current).toBeUndefined();
		});

		it('should return the latest diaper change', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
				containsStool: false,
				containsUrine: true,
				timestamp: '2024-01-01T10:00:00Z',
			});
			store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd2', {
				containsStool: false,
				containsUrine: true,
				timestamp: '2024-01-01T11:00:00Z',
			});

			const { result } = renderHook(() => useLatestDiaperChangeRecord(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current?.id).toBe('d2');
		});
	});
});
