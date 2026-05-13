import { act, renderHook } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it } from 'vitest';
import { STORE_VALUE_SELECTED_PROFILE_ID } from '@/lib/tinybase-sync/constants';
import { useSelectedProfileId } from './use-selected-profile-id';

describe('useSelectedProfileId', () => {
	it('should return undefined when no profile is selected', () => {
		const store = createStore();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<Provider store={store}>{children}</Provider>
		);

		const { result } = renderHook(() => useSelectedProfileId(), { wrapper });

		expect(result.current[0]).toBeUndefined();
	});

	it('should return the selected profile ID from the store', () => {
		const store = createStore();
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'test-profile');
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<Provider store={store}>{children}</Provider>
		);

		const { result } = renderHook(() => useSelectedProfileId(), { wrapper });

		expect(result.current[0]).toBe('test-profile');
	});

	it('should update the selected profile ID in the store', () => {
		const store = createStore();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<Provider store={store}>{children}</Provider>
		);

		const { result } = renderHook(() => useSelectedProfileId(), { wrapper });

		act(() => {
			result.current[1]('new-profile');
		});

		expect(store.getValue(STORE_VALUE_SELECTED_PROFILE_ID)).toBe('new-profile');
		expect(result.current[0]).toBe('new-profile');
	});
});
