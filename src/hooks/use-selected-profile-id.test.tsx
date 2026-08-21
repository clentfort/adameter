import { act, renderHook, waitFor } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DataSynchronizationContext } from '@/contexts/data-synchronization-context';
import { STORAGE_KEYS } from '@/lib/storage';
import {
	STORE_VALUE_SELECTED_PROFILE_ID,
	TABLE_IDS,
} from '@/lib/tinybase-sync/constants';
import { useSelectedProfileId } from './use-selected-profile-id';

function createWrapper(store: ReturnType<typeof createStore>, room?: string) {
	function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<DataSynchronizationContext.Provider
				value={{
					isHydrated: true,
					joinRoom: () => {},
					joinStrategy: 'merge',
					leaveRoom: () => {},
					resetJoinStrategy: () => {},
					room,
					setRoom: () => {},
				}}
			>
				<Provider store={store}>{children}</Provider>
			</DataSynchronizationContext.Provider>
		);
	}

	return Wrapper;
}

describe('useSelectedProfileId', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it('returns undefined when no profile exists', () => {
		const store = createStore();
		const { result } = renderHook(() => useSelectedProfileId(), {
			wrapper: createWrapper(store),
		});

		expect(result.current[0]).toBeUndefined();
	});

	it('uses the legacy store selection while data is not shared', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.PROFILES, 'test-profile', { name: 'Ada' });
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'test-profile');

		const { result } = renderHook(() => useSelectedProfileId(), {
			wrapper: createWrapper(store),
		});

		expect(result.current[0]).toBe('test-profile');
	});

	it('stores selection locally and updates the legacy value while unshared', async () => {
		const store = createStore();
		store.setRow(TABLE_IDS.PROFILES, 'new-profile', { name: 'Ada' });
		const { result } = renderHook(() => useSelectedProfileId(), {
			wrapper: createWrapper(store),
		});

		act(() => {
			result.current[1]('new-profile');
		});

		await waitFor(() => {
			expect(result.current[0]).toBe('new-profile');
		});
		expect(store.getValue(STORE_VALUE_SELECTED_PROFILE_ID)).toBe('new-profile');
		expect(window.localStorage.getItem(STORAGE_KEYS.SELECTED_PROFILE_ID)).toBe(
			'new-profile',
		);
	});

	it("does not let another device's shared selection override local choice", async () => {
		const store = createStore();
		store.setRow(TABLE_IDS.PROFILES, 'ada', { name: 'Ada' });
		store.setRow(TABLE_IDS.PROFILES, 'noam', { name: 'Noam' });
		store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'noam');

		const { result } = renderHook(() => useSelectedProfileId(), {
			wrapper: createWrapper(store, 'shared-room'),
		});

		expect(result.current[0]).toBe('ada');

		act(() => {
			result.current[1]('noam');
		});

		await waitFor(() => {
			expect(result.current[0]).toBe('noam');
		});
		expect(store.getValue(STORE_VALUE_SELECTED_PROFILE_ID)).toBe('noam');

		act(() => {
			store.setValue(STORE_VALUE_SELECTED_PROFILE_ID, 'ada');
		});
		expect(result.current[0]).toBe('noam');
	});
});
