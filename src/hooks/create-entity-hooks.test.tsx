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

	it('should improve coverage by exercising multi-profile filtering and edge cases', () => {
		const store = createTestStore();
		store.setValues({ selectedProfileId: 'p1' });

		// 1. Multi-profile filtering logic in useIds, useSnapshot, and useOne
		store.setRow(TABLE_ID, '1', { name: 'P1 Item', profileId: 'p1' });
		store.setRow(TABLE_ID, '2', { name: 'P2 Item', profileId: 'p2' });
		store.setRow(TABLE_ID, '3', { name: 'No Profile Item' });

		const { result: idsResult } = renderHook(() => testHooks.useIds(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});
		const { result: snapshotResult } = renderHook(
			() => testHooks.useSnapshot(),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);
		const { result: oneResult } = renderHook(() => testHooks.useOne('2'), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		expect(idsResult.current).toEqual(['1']);
		expect(snapshotResult.current).toEqual([{ id: '1', name: 'P1 Item' }]);
		expect(oneResult.current).toBeUndefined();

		// 2. Profile-aware behavior when no profile is selected
		const noProfileStore = createTestStore();
		noProfileStore.setRow(TABLE_ID, '1', { name: 'P1 Item', profileId: 'p1' });
		noProfileStore.setRow(TABLE_ID, '2', { name: 'P2 Item', profileId: 'p2' });
		noProfileStore.setRow(TABLE_ID, '3', { name: 'No Profile Item' });
		const { result: noProfileIdsResult } = renderHook(() => testHooks.useIds(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={noProfileStore}>
					{children}
				</TinyBaseTestWrapper>
			),
		});
		expect(noProfileIdsResult.current).toEqual(['1', '2', '3']);

		// 3. profile table exception (should not filter even if selectedProfileId is set)
		const PROFILES_TABLE_ID = 'profiles';
		const profileHooks = createEntityHooks<TestEntity>({
			sanitize,
			tableId: PROFILES_TABLE_ID,
			toEntity,
		});
		store.setValues({ selectedProfileId: 'p1' });
		store.setRow(PROFILES_TABLE_ID, 'p1', { name: 'Profile 1' });
		store.setRow(PROFILES_TABLE_ID, 'p2', { name: 'Profile 2' });

		const { result: profileIdsResult } = renderHook(
			() => profileHooks.useIds(),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);
		expect(profileIdsResult.current).toEqual(['p1', 'p2']);

		// 3b. useSnapshot with profile table exception
		const { result: profileSnapshotResult } = renderHook(
			() => profileHooks.useSnapshot(),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);
		expect(profileSnapshotResult.current).toHaveLength(2);

		// 4. useSnapshot handling toEntity returning null
		store.setRow(TABLE_ID, 'invalid', { name: 123 });
		const customHooks = createEntityHooks<TestEntity>({
			sanitize,
			tableId: TABLE_ID,
			toEntity: (id, row) =>
				typeof row.name === 'string' ? { id, name: row.name } : null,
		});
		const { result: invalidSnapshotResult } = renderHook(
			() => customHooks.useSnapshot(),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);
		expect(invalidSnapshotResult.current.find((e) => e.id === 'invalid')).toBe(
			undefined,
		);

		// 5. useUpsert edge cases (sanitize returning null, and profileId injection)
		const nullSanitizeHooks = createEntityHooks<TestEntity>({
			sanitize: () => null,
			tableId: TABLE_ID,
			toEntity,
		});
		const { result: upsertResult } = renderHook(
			() => nullSanitizeHooks.useUpsert(),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);
		act(() => {
			upsertResult.current({ id: 'null-test', name: 'Test' });
		});
		expect(store.getRow(TABLE_ID, 'null-test')).toEqual({});

		const { result: validUpsertResult } = renderHook(() => testHooks.useUpsert(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});
		act(() => {
			validUpsertResult.current({ id: 'p1-test', name: 'Test' });
		});
		expect(store.getRow(TABLE_ID, 'p1-test')).toEqual({
			deviceId: 'test-device-id',
			name: 'Test',
			profileId: 'p1',
		});
	});
});
