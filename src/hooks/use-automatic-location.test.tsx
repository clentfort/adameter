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

	it('returns null and does not initiate request if disabled or tracking is off', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, false);
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

	it('disables location tracking when permission is denied during automatic fetch on mount', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);

		const PERMISSION_DENIED = 1;
		const mockGetCurrentPosition = vi.fn((_success, error) => {
			error({
				code: PERMISSION_DENIED,
				message: 'User denied Geolocation',
				PERMISSION_DENIED,
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		renderHook(() => useAutomaticLocation({ enabled: true }), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		await vi.waitFor(() => {
			expect(store.getValue(STORE_VALUE_LOCATION_TRACKING)).toBe(false);
		});
	});

	it('fetches location on demand in getLocation when not pre-initialized on mount', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, false);

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

		let enabled = false;

		const { rerender, result } = renderHook(
			() => useAutomaticLocation({ enabled }),
			{
				wrapper: ({ children }) => (
					<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
				),
			},
		);

		// While enabled=false, locationPromiseRef.current is null.
		// Now enable location tracking and set enabled=true without mounting a new effect state.
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);
		enabled = true;
		rerender();

		// getLocation should check !locationPromiseRef.current and initiate request
		const location = await result.current.getLocation();
		expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
		expect(location).toEqual({ latitude: 48.8566, longitude: 2.3522 });
	});
});
