import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_SELECTED_PROFILE_ID, TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useProfile, useUpsertProfile } from './use-profile';

describe('useProfile', () => {
	it('should return null when no profile exists', () => {
		const { result } = renderHook(() => useProfile(), {
			wrapper: TinyBaseTestWrapper,
		});
		expect(result.current[0]).toBeNull();
	});

	it('should set and return a profile', () => {
		const store = createTestStore();
		const { result: profileHook } = renderHook(() => useProfile(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});
		const { result: upsertHook } = renderHook(() => useUpsertProfile(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		const profile = { id: 'p1', name: 'Baby Ada' };

		act(() => {
			upsertHook.current(profile);
			store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'p1');
		});

		expect(profileHook.current[0]).toMatchObject({ name: 'Baby Ada' });
		expect(store.getRow(TABLE_IDS.PROFILES, 'p1')).toMatchObject({ name: 'Baby Ada' });
	});
});
