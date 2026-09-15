import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_LOCATION_TRACKING } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useLocationTracking } from './use-location-tracking';

describe('useLocationTracking', () => {
	it('should default to true', () => {
		const { result } = renderHook(() => useLocationTracking(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current[0]).toBe(true);
	});

	it('should return value from store', () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, false);

		const { result } = renderHook(() => useLocationTracking(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		expect(result.current[0]).toBe(false);
	});

	it('should update store when setter is called', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useLocationTracking(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			result.current[1](false);
		});

		expect(store.getValue(STORE_VALUE_LOCATION_TRACKING)).toBe(false);
		expect(result.current[0]).toBe(false);
	});
});
