import type { Row } from 'tinybase';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { createEntityHooks } from './create-entity-hooks';

// Mock getDeviceId
vi.mock('@/utils/device-id', () => ({
	getDeviceId: () => 'test-device-id',
}));

interface TestEntity {
	id: string;
	name: string;
}

const TABLE_ID = 'test_table';

const toEntity = (id: string, row: Row): TestEntity => ({
	id,
	name: row.name as string,
});

const sanitize = (entity: TestEntity) => ({
	name: entity.name,
});

const testHooks = createEntityHooks<TestEntity>({
	sanitize,
	tableId: TABLE_ID,
	toEntity,
});

describe('createEntityHooks', () => {
	describe('useUpsert', () => {
		it('should upsert an entity', () => {
			const store = createTestStore();
			const { result } = renderHook(() => testHooks.useUpsert(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current({ id: '1', name: 'Test' });
			});

			expect(store.getRow(TABLE_ID, '1')).toEqual({
				deviceId: 'test-device-id',
				name: 'Test',
			});
		});
	});

	describe('useRemove', () => {
		it('should remove an entity', () => {
			const store = createTestStore();
			store.setRow(TABLE_ID, '1', { name: 'Test' });

			const { result } = renderHook(() => testHooks.useRemove(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			act(() => {
				result.current('1');
			});

			expect(store.hasRow(TABLE_ID, '1')).toBe(false);
		});
	});

	describe('useOne', () => {
		it('should return undefined for non-existent entity', () => {
			const { result } = renderHook(() => testHooks.useOne('1'), {
				wrapper: TinyBaseTestWrapper,
			});
			expect(result.current).toBeUndefined();
		});

		it('should return the entity', () => {
			const store = createTestStore();
			store.setRow(TABLE_ID, '1', { name: 'Test' });

			const { result } = renderHook(() => testHooks.useOne('1'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual({ id: '1', name: 'Test' });
		});
	});

	describe('useSnapshot', () => {
		it('should return all entities', () => {
			const store = createTestStore();
			store.setRow(TABLE_ID, '1', { name: 'Test 1' });
			store.setRow(TABLE_ID, '2', { name: 'Test 2' });

			const { result } = renderHook(() => testHooks.useSnapshot(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual([
				{ id: '1', name: 'Test 1' },
				{ id: '2', name: 'Test 2' },
			]);
		});
	});

	describe('useIds', () => {
		it('should return all entity IDs', () => {
			const store = createTestStore();
			store.setRow(TABLE_ID, '1', { name: 'Test 1' });
			store.setRow(TABLE_ID, '2', { name: 'Test 2' });

			const { result } = renderHook(() => testHooks.useIds(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});

			expect(result.current).toEqual(['1', '2']);
		});
	});
});
