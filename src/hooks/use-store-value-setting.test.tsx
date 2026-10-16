import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useStoreValueSetting } from './use-store-value-setting';

describe('useStoreValueSetting', () => {
	it('should return default fallback when value is not set in store', () => {
		const { result } = renderHook(
			() => useStoreValueSetting('testValue', 'defaultString'),
			{
				wrapper: TinyBaseTestWrapper,
			},
		);
		expect(result.current[0]).toBe('defaultString');
	});

	it('should return stored value when value is set in store', () => {
		const store = createTestStore();
		store.setValue('testValue', 'storedValue');

		const { result } = renderHook(
			() => useStoreValueSetting('testValue', 'defaultString'),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);

		expect(result.current[0]).toBe('storedValue');
	});

	it('should update value in store when setter is called', () => {
		const store = createTestStore();
		const { result } = renderHook(
			() => useStoreValueSetting<number>('testNumber', 10),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);

		expect(result.current[0]).toBe(10);

		act(() => {
			result.current[1](42);
		});

		expect(result.current[0]).toBe(42);
		expect(store.getValue('testNumber')).toBe(42);
	});
});
