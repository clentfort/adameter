import type { DiaperChange, DiaperProduct } from '@/types/diaper';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { createTestStore, TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import {
	useDiaperProduct,
	useDiaperProductsSnapshot,
	useFrecencySortedDiaperProductIds,
	useRemoveDiaperProduct,
	useSortedDiaperProductIds,
	useUpsertDiaperProduct,
} from './use-diaper-products';

vi.mock('@/utils/device-id', () => ({
	getDeviceId: () => 'test-device-id',
}));

describe('useDiaperProducts', () => {
	describe('useUpsertDiaperProduct', () => {
		it('should create or update a diaper product', () => {
			const store = createTestStore();
			const { result } = renderHook(() => useUpsertDiaperProduct(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current({
					id: 'p1',
					isReusable: false,
					name: 'Pampers',
				} as DiaperProduct);
			});

			expect(store.getRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1')).toEqual({
				deviceId: 'test-device-id',
				isReusable: false,
				name: 'Pampers',
			});
		});
	});

	describe('useRemoveDiaperProduct', () => {
		it('should remove a diaper product', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', { name: 'Pampers' });

			const { result } = renderHook(() => useRemoveDiaperProduct(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current('p1');
			});

			expect(store.hasRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1')).toBe(false);
		});
	});

	describe('useDiaperProduct', () => {
		it('should return the diaper product for valid id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', { name: 'Pampers' });

			const { result } = renderHook(() => useDiaperProduct('p1'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual({ id: 'p1', name: 'Pampers' });
		});
	});

	describe('useSortedDiaperProductIds', () => {
		it('should return product IDs sorted by archived status and name', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', { archived: true, isReusable: false, name: 'B' });
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p2', { archived: false, isReusable: false, name: 'C' });
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p3', { archived: false, isReusable: false, name: 'A' });

			const { result } = renderHook(() => useSortedDiaperProductIds(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			// A, C, B (archived)
			expect(result.current).toEqual(['p3', 'p2', 'p1']);
		});
	});

	describe('useFrecencySortedDiaperProductIds', () => {
		it('should return frecency sorted product IDs', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', { isReusable: false, name: 'P1' });
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p2', { isReusable: false, name: 'P2' });

			const changes = [
				{ productId: 'p1', timestamp: '2024-01-01T10:00:00Z' },
				{ productId: 'p1', timestamp: '2024-01-01T11:00:00Z' },
			] as unknown as DiaperChange[];

			const { result } = renderHook(
				() => useFrecencySortedDiaperProductIds(changes),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);

			expect(result.current).toEqual(['p1', 'p2']);
		});
	});

	describe('useDiaperProductsSnapshot', () => {
		it('should return all diaper products', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.DIAPER_PRODUCTS, 'p1', { name: 'P1' });

			const { result } = renderHook(() => useDiaperProductsSnapshot(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toHaveLength(1);
			expect(result.current[0].id).toBe('p1');
		});
	});
});
