import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_LOCATION_TRACKING } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useAutomaticLocation } from './use-automatic-location';

describe('useAutomaticLocation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('initiates location request on mount and resolves coordinates via getLocation', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);

		const mockGetCurrentPosition = vi.fn((success) => {
			success({
				coords: {
					latitude: 52.52,
					longitude: 13.405,
				},
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		const { result } = renderHook(
			() => useAutomaticLocation({ enabled: true }),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);

		const location = await result.current.getLocation();
		expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
		expect(location).toEqual({ latitude: 52.52, longitude: 13.405 });
	});

	it('returns null and does not initiate request if disabled', async () => {
		const store = createTestStore();
		const mockGetCurrentPosition = vi.fn();

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		const { result } = renderHook(
			() => useAutomaticLocation({ enabled: false }),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);

		const location = await result.current.getLocation();
		expect(mockGetCurrentPosition).not.toHaveBeenCalled();
		expect(location).toBeNull();
	});

	it('disables location tracking when permission is denied during location fetch', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);

		const mockGetCurrentPosition = vi.fn((_success, error) => {
			error({
				code: 1,
				PERMISSION_DENIED: 1,
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		const { result } = renderHook(
			() => useAutomaticLocation({ enabled: true }),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);

		const location = await result.current.getLocation();
		expect(location).toBeNull();
		expect(store.getValue(STORE_VALUE_LOCATION_TRACKING)).toBe(false);
	});

	it('fetches location on-demand when locationPromiseRef is null during initial render', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);

		const mockGetCurrentPosition = vi.fn((success) => {
			success({
				coords: {
					latitude: 48.8566,
					longitude: 2.3522,
				},
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		let locationPromise: Promise<{
			latitude: number;
			longitude: number;
		} | null> | null = null;

		function TestComponent() {
			const { getLocation } = useAutomaticLocation({ enabled: true });
			if (!locationPromise) {
				locationPromise = getLocation(new Date());
			}
			return null;
		}

		renderHook(() => TestComponent(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		const location = await locationPromise;
		expect(mockGetCurrentPosition).toHaveBeenCalled();
		expect(location).toEqual({ latitude: 48.8566, longitude: 2.3522 });
	});

	it('disables location tracking on-demand when permission is denied and locationPromiseRef is null', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);

		const mockGetCurrentPosition = vi.fn((_success, error) => {
			error({
				code: 1,
				PERMISSION_DENIED: 1,
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		let locationPromise: Promise<{
			latitude: number;
			longitude: number;
		} | null> | null = null;

		function TestComponent() {
			const { getLocation } = useAutomaticLocation({ enabled: true });
			if (!locationPromise) {
				locationPromise = getLocation();
			}
			return null;
		}

		renderHook(() => TestComponent(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		const location = await locationPromise;
		expect(location).toBeNull();
		expect(store.getValue(STORE_VALUE_LOCATION_TRACKING)).toBe(false);
	});
});
