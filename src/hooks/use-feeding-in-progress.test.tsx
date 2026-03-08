import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_FEEDING_IN_PROGRESS } from '@/lib/tinybase-sync/constants';
import { createTestStore, TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import { useFeedingInProgress } from './use-feeding-in-progress';

describe('useFeedingInProgress', () => {
	it('should return null when not set', () => {
		const { result } = renderHook(() => useFeedingInProgress(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current[0]).toBeNull();
	});

	it('should set and return a feeding in progress', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useFeedingInProgress(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		const feeding = { breast: 'left' as const, startTime: '2024-01-01T10:00:00Z' };

		act(() => {
			result.current[1](feeding);
		});

		expect(result.current[0]).toEqual(feeding);
		expect(store.getValue(STORE_VALUE_FEEDING_IN_PROGRESS)).toBe(JSON.stringify(feeding));
	});

	it('should clear feeding in progress when null is passed', () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_FEEDING_IN_PROGRESS, JSON.stringify({ breast: 'left' }));

		const { result } = renderHook(() => useFeedingInProgress(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			result.current[1](null);
		});

		expect(result.current[0]).toBeNull();
		expect(store.hasValue(STORE_VALUE_FEEDING_IN_PROGRESS)).toBe(false);
	});
});
