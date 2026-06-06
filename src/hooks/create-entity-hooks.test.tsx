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

	describe('multi-profile isolation', () => {
		it('should handle profile-based filtering and injection', () => {
			const store = createTestStore();
			// Set a selected profile ID in values
			store.setValue('selectedProfileId', 'profile-1');

			// 1. useUpsert should inject profileId
			const { result: upsertResult } = renderHook(() => testHooks.useUpsert(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});
			act(() => {
				upsertResult.current({ id: 'e1', name: 'Entity 1' });
			});
			expect(store.getRow(TABLE_ID, 'e1')).toEqual({
				deviceId: 'test-device-id',
				name: 'Entity 1',
				profileId: 'profile-1',
			});

			// 2. useOne should return undefined for mismatched profile
			store.setRow(TABLE_ID, 'e2', {
				name: 'Entity 2',
				profileId: 'profile-2',
			});
			const { result: oneResult } = renderHook(() => testHooks.useOne('e2'), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});
			expect(oneResult.current).toBeUndefined();

			// 3. useSnapshot should filter by profile
			const { result: snapshotResult } = renderHook(
				() => testHooks.useSnapshot(),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);
			expect(snapshotResult.current).toEqual([{ id: 'e1', name: 'Entity 1' }]);

			// 4. useIds should filter by profile
			const { result: idsResult } = renderHook(() => testHooks.useIds(), {
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			});
			expect(idsResult.current).toEqual(['e1']);

			// 5. PROFILES table special case for useSnapshot (should not filter)
			const profilesHooks = createEntityHooks<TestEntity>({
				sanitize,
				tableId: 'profiles',
				toEntity,
			});
			store.setRow('profiles', 'p1', { name: 'Profile 1' });
			store.setRow('profiles', 'p2', { name: 'Profile 2' });
			const { result: profilesSnapshotResult } = renderHook(
				() => profilesHooks.useSnapshot(),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);
			expect(profilesSnapshotResult.current).toHaveLength(2);

			// 6. Handle null return from sanitize or mapping
			const nullHooks = createEntityHooks<TestEntity>({
				sanitize: () => null,
				tableId: 'null_table',
				toEntity: () => null,
			});
			const { result: nullUpsertResult } = renderHook(
				() => nullHooks.useUpsert(),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);
			act(() => {
				nullUpsertResult.current({ id: 'null-id', name: 'Null' });
			});
			expect(store.getRow('null_table', 'null-id')).toEqual({});

			// Ensure the row has the correct profileId to reach line 72 in useOne
			store.setRow('null_table', 'null-id', {
				name: 'Null',
				profileId: 'profile-1',
			});
			const { result: nullOneResult } = renderHook(
				() => nullHooks.useOne('null-id'),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);
			expect(nullOneResult.current).toBeUndefined();

			const { result: nullSnapshotResult } = renderHook(
				() => nullHooks.useSnapshot(),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);
			expect(nullSnapshotResult.current).toEqual([]);

			// 7. useOne with undefined ID
			const { result: undefinedOneResult } = renderHook(
				() => testHooks.useOne(undefined),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);
			expect(undefinedOneResult.current).toBeUndefined();

			// 8. useIds for PROFILES table
			const { result: profilesIdsResult } = renderHook(
				() => profilesHooks.useIds(),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);
			expect(profilesIdsResult.current).toEqual(['p1', 'p2']);

			// 9. No profile selected
			const newStore = createTestStore();
			newStore.setRow(TABLE_ID, 'e1', { name: 'E1' });
			newStore.setRow(TABLE_ID, 'e2', { name: 'E2' });

			const { result: noProfileIdsResult } = renderHook(
				() => testHooks.useIds(),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={newStore}>
							{children}
						</TinyBaseTestWrapper>
					),
				},
			);
			expect(noProfileIdsResult.current).toEqual(['e1', 'e2']);

			// 10. useUpsert for PROFILES table (should NOT inject profileId)
			const { result: profilesUpsertResult } = renderHook(
				() => profilesHooks.useUpsert(),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
					),
				},
			);
			act(() => {
				profilesUpsertResult.current({ id: 'p3', name: 'Profile 3' });
			});
			expect(store.getRow('profiles', 'p3')).toEqual({
				deviceId: 'test-device-id',
				name: 'Profile 3',
			});

			// 11. useSnapshot with no profile selected
			const { result: noProfileSnapshotResult } = renderHook(
				() => testHooks.useSnapshot(),
				{
					wrapper: ({ children }) => (
						<TinyBaseTestWrapper store={newStore}>
							{children}
						</TinyBaseTestWrapper>
					),
				},
			);
			expect(noProfileSnapshotResult.current).toHaveLength(2);
		});
	});
});
