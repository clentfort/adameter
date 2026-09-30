import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_VALUE_LOCATION_TRACKING } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { requestAutomaticLocation } from '@/utils/get-automatic-location';
import { useAutomaticLocation } from './use-automatic-location';

vi.mock('@/utils/get-automatic-location', async (importOriginal) => {
	const actual =
		await importOriginal<typeof import('@/utils/get-automatic-location')>();
	return {
		...actual,
		requestAutomaticLocation: vi.fn(actual.requestAutomaticLocation),
	};
});

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

	it('initiates location request on demand inside getLocation if locationPromiseRef is null', async () => {
		const store = createTestStore();
		store.setValue(STORE_VALUE_LOCATION_TRACKING, true);

		vi.mocked(requestAutomaticLocation)
			.mockReturnValueOnce(null as unknown as Promise<null>)
			.mockImplementationOnce(async ({ onPermissionDenied }) => {
				onPermissionDenied?.();
				return { latitude: 48.8566, longitude: 2.3522 };
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
		expect(requestAutomaticLocation).toHaveBeenCalledTimes(2);
		expect(location).toEqual({ latitude: 48.8566, longitude: 2.3522 });
		expect(store.getValue(STORE_VALUE_LOCATION_TRACKING)).toBe(false);
	});
});
