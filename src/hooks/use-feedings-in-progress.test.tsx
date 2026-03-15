import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useFeedingsInProgressSnapshot, useUpsertFeedingInProgress } from './use-feedings-in-progress';

describe('useFeedingsInProgress', () => {
	it('should return empty array when not set', () => {
		const { result } = renderHook(() => useFeedingsInProgressSnapshot(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current).toEqual([]);
	});

	it('should set and return a feeding in progress', () => {
		const store = createTestStore();
		const { result: upsert } = renderHook(() => useUpsertFeedingInProgress(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});
		const { result: snapshot } = renderHook(() => useFeedingsInProgressSnapshot(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		const feeding = {
			breast: 'left' as const,
			id: 'test-id',
			startTime: '2024-01-01T10:00:00Z',
			type: 'breast' as const,
		};

		act(() => {
			upsert.current(feeding);
		});

		expect(snapshot.current).toHaveLength(1);
		expect(snapshot.current[0]).toMatchObject(feeding);
		expect(store.getRow(TABLE_IDS.FEEDINGS_IN_PROGRESS, 'test-id')).toMatchObject({
			breast: 'left',
			startTime: '2024-01-01T10:00:00Z',
			type: 'breast',
		});
	});
});
