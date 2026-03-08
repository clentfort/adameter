import type { Tooth } from '@/types/teething';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { createTestStore, TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import { useTeethSnapshot, useTooth, useUpsertTooth } from './use-teething';

vi.mock('@/utils/device-id', () => ({
	getDeviceId: () => 'test-device-id',
}));

describe('useTeething', () => {
	describe('useUpsertTooth', () => {
		it('should create or update a tooth record', () => {
			const store = createTestStore();
			const { result } = renderHook(() => useUpsertTooth(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current({
					date: '2024-01-01',
					id: 't51',
					toothId: 51,
				} as Tooth);
			});

			expect(store.getRow(TABLE_IDS.TEETHING, 't51')).toEqual({
				date: '2024-01-01',
				deviceId: 'test-device-id',
				toothId: 51,
			});
		});
	});

	describe('useTooth', () => {
		it('should return the tooth record for valid id', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.TEETHING, 't51', {
				date: '2024-01-01',
				toothId: 51,
			});

			const { result } = renderHook(() => useTooth('t51'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual({
				date: '2024-01-01',
				id: 't51',
				toothId: 51,
			});
		});
	});

	describe('useTeethSnapshot', () => {
		it('should return all teeth records', () => {
			const store = createTestStore();
			store.setRow(TABLE_IDS.TEETHING, 't51', { toothId: 51 });

			const { result } = renderHook(() => useTeethSnapshot(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toHaveLength(1);
			expect(result.current[0]).toEqual({
				id: 't51',
				toothId: 51,
			});
		});
	});
});
