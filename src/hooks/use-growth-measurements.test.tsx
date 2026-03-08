import type { GrowthMeasurement } from '@/types/growth';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { createTestStore, TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import {
	useGrowthMeasurement,
	useGrowthMeasurementsSnapshot,
	useRemoveGrowthMeasurement,
	useUpsertGrowthMeasurement,
} from './use-growth-measurements';

vi.mock('@/utils/device-id', () => ({
	getDeviceId: () => 'test-device-id',
}));

describe('useGrowthMeasurements', () => {
	describe('useUpsertGrowthMeasurement', () => {
		it('should create a new growth measurement', () => {
			const store = createTestStore();
			const { result } = renderHook(() => useUpsertGrowthMeasurement(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			const newMeasurement = {
				date: '2024-01-01',
				id: 'g1',
				weight: 3500,
			} as GrowthMeasurement;

			act(() => {
				result.current(newMeasurement);
			});

			expect(store.getRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'g1')).toEqual({
				date: '2024-01-01',
				deviceId: 'test-device-id',
				weight: 3500,
			});
		});
	});

	describe('useRemoveGrowthMeasurement', () => {
		it('should remove a growth measurement by id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'g1', {
				date: '2024-01-01',
			});

			const { result } = renderHook(() => useRemoveGrowthMeasurement(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current('g1');
			});

			expect(store.hasRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'g1')).toBe(false);
		});
	});

	describe('useGrowthMeasurement', () => {
		it('should return the growth measurement for valid id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'g1', {
				date: '2024-01-01',
				weight: 3500,
			});

			const { result } = renderHook(() => useGrowthMeasurement('g1'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual({
				date: '2024-01-01',
				id: 'g1',
				weight: 3500,
			});
		});
	});

	describe('useGrowthMeasurementsSnapshot', () => {
		it('should return all growth measurements', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'g1', {
				date: '2024-01-01',
			});

			const { result } = renderHook(() => useGrowthMeasurementsSnapshot(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toHaveLength(1);
			expect(result.current[0].id).toBe('g1');
		});
	});
});
