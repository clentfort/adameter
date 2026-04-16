import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_SHOW_FEEDING } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useShowFeeding } from './use-show-feeding';

describe('useShowFeeding', () => {
	it('should default to undefined', () => {
		const { result } = renderHook(() => useShowFeeding(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current[0]).toBe(undefined);
	});

	it('should return value from store', () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_SHOW_FEEDING, false);

		const { result } = renderHook(() => useShowFeeding(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		expect(result.current[0]).toBe(false);
	});

	it('should update store when setter is called', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useShowFeeding(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			result.current[1](false);
		});

		expect(store.getValue(STORE_VALUE_SHOW_FEEDING)).toBe(false);
		expect(result.current[0]).toBe(false);
	});
});
