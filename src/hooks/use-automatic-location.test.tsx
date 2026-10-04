import { render, renderHook } from '@testing-library/react';
import { useLayoutEffect } from 'react';
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

	it('fetches location on demand inside getLocation when locationPromiseRef is null before useEffect runs', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);

		const mockGetCurrentPosition = vi.fn((success) => {
			success({
				coords: {
					latitude: 40.7128,
					longitude: -74.006,
				},
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		let locationPromise: Promise<{ latitude: number; longitude: number } | null> | null = null;

		function TestComponent() {
			const { getLocation } = useAutomaticLocation({ enabled: true });
			useLayoutEffect(() => {
				locationPromise = getLocation();
			}, [getLocation]);
			return null;
		}

		render(
			<TinyBaseTestWrapper store={store}>
				<TestComponent />
			</TinyBaseTestWrapper>,
		);

		const location = await locationPromise;
		expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
		expect(location).toEqual({ latitude: 40.7128, longitude: -74.006 });
	});
});
