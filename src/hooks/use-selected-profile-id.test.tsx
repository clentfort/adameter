import { act, renderHook, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
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

	it('updates selection on window storage events', async () => {
		const store = createStore();
		store.setRow(TABLE_IDS.PROFILES, 'ada', { name: 'Ada' });
		store.setRow(TABLE_IDS.PROFILES, 'noam', { name: 'Noam' });

		const { result } = renderHook(() => useSelectedProfileId(), {
			wrapper: createWrapper(store),
		});

		expect(result.current[0]).toBe('ada');

		act(() => {
			window.localStorage.setItem(STORAGE_KEYS.SELECTED_PROFILE_ID, 'noam');
			window.dispatchEvent(new Event('storage'));
		});

		await waitFor(() => {
			expect(result.current[0]).toBe('noam');
		});
	});

	it('handles SSR via renderToString', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.PROFILES, 'ada', { name: 'Ada' });

		function TestComponent() {
			const [selectedProfileId] = useSelectedProfileId();
			return <div>{selectedProfileId ?? 'none'}</div>;
		}

		const Wrapper = createWrapper(store);
		const html = renderToString(
			<Wrapper>
				<TestComponent />
			</Wrapper>,
		);

		expect(html).toContain('ada');
	});

	it('handles SSR when window is undefined during renderToString', () => {
		const store = createStore();

		function TestComponent() {
			const [selectedProfileId] = useSelectedProfileId();
			return <div>{selectedProfileId ?? 'none'}</div>;
		}

		const Wrapper = createWrapper(store);
		const originalWindow = globalThis.window;
		try {
			// @ts-expect-error - simulating non-browser environment
			delete globalThis.window;

			const html = renderToString(
				<Wrapper>
					<TestComponent />
				</Wrapper>,
			);

			expect(html).toContain('none');
		} finally {
			globalThis.window = originalWindow;
		}
	});

	it('returns dummy cleanup from subscribe when window is undefined during mount', () => {
		const store = createStore();
		const originalWindow = globalThis.window;

		Object.defineProperty(globalThis, 'window', {
			configurable: true,
			get() {
				const stack = new Error().stack ?? '';
				if (stack.includes('subscribeToLocallySelectedProfileId')) {
					return undefined;
				}
				return originalWindow;
			},
		});

		try {
			const { unmount } = renderHook(() => useSelectedProfileId(), {
				wrapper: createWrapper(store),
			});
			unmount();
		} finally {
			Object.defineProperty(globalThis, 'window', {
				configurable: true,
				value: originalWindow,
				writable: true,
			});
		}
	});
});
