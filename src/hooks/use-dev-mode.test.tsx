import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_DEV_MODE } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useDevMode } from './use-dev-mode';

describe('useDevMode', () => {
	it('should return false by default', () => {
		const { result } = renderHook(() => useDevMode(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current[0]).toBe(false);
	});

	it('should set and return a new dev mode value', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useDevMode(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			result.current[1](true);
		});

		expect(result.current[0]).toBe(true);
		expect(store.getValue(STORE_VALUE_DEV_MODE)).toBe(true);
	});

	it('should reflect changes from the store', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useDevMode(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			store.setValue(STORE_VALUE_DEV_MODE, true);
		});

		expect(result.current[0]).toBe(true);
	});
});
