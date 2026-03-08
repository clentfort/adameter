import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_CURRENCY } from '@/lib/tinybase-sync/constants';
import { createTestStore, TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import { useCurrency } from './use-currency';

describe('useCurrency', () => {
	it('should return default currency (GBP) when not set', () => {
		const { result } = renderHook(() => useCurrency(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current[0]).toBe('GBP');
	});

	it('should set and return a new currency', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useCurrency(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			result.current[1]('EUR');
		});

		expect(result.current[0]).toBe('EUR');
		expect(store.getValue(STORE_VALUE_CURRENCY)).toBe('EUR');
	});

	it('should reflect changes from the store', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useCurrency(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			store.setValue(STORE_VALUE_CURRENCY, 'USD');
		});

		expect(result.current[0]).toBe('USD');
	});
});
