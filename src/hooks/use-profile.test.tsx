import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_PROFILE } from '@/lib/tinybase-sync/constants';
import { createTestStore, TinyBaseTestWrapper } from '@/test-utils/tinybase-test-wrapper';
import { useProfile } from './use-profile';

describe('useProfile', () => {
	it('should return null when no profile exists', () => {
		const { result } = renderHook(() => useProfile(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current[0]).toBeNull();
	});

	it('should set and return a profile', () => {
		const store = createTestStore();
		const { result } = renderHook(() => useProfile(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		const profile = { name: 'Baby Ada', birthday: '2024-01-01' };

		act(() => {
			result.current[1](profile);
		});

		expect(result.current[0]).toEqual(profile);
		expect(store.getValue(STORE_VALUE_PROFILE)).toBe(JSON.stringify(profile));
	});

	it('should clear profile when null is passed', () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_PROFILE, JSON.stringify({ name: 'Ada' }));

		const { result } = renderHook(() => useProfile(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		act(() => {
			result.current[1](null);
		});

		expect(result.current[0]).toBeNull();
		expect(store.getValue(STORE_VALUE_PROFILE)).toBe('');
	});
});
