import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAutomaticLocation } from './get-automatic-location';

describe('requestAutomaticLocation', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('returns null if location tracking is disabled', async () => {
		const result = await requestAutomaticLocation({
			isLocationTrackingEnabled: false,
			timestamp: new Date('2025-01-01T12:00:00Z'),
		});
		expect(result).toBeNull();
	});

	it('returns null if timestamp is invalid', async () => {
		const result = await requestAutomaticLocation({
			isLocationTrackingEnabled: true,
			timestamp: 'invalid-date',
		});
		expect(result).toBeNull();
	});

	it('returns null if timestamp is more than 15 minutes away', async () => {
		const result = await requestAutomaticLocation({
			isLocationTrackingEnabled: true,
			timestamp: new Date('2025-01-01T11:40:00Z'), // 20 mins ago
		});
		expect(result).toBeNull();
	});

	it('returns coordinates if timestamp is within 15 minutes and geolocation succeeds', async () => {
		const mockGetCurrentPosition = vi.fn((success) => {
			success({
				coords: {
					latitude: 37.774_929,
					longitude: -122.419_416,
				},
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		const result = await requestAutomaticLocation({
			isLocationTrackingEnabled: true,
			timestamp: new Date('2025-01-01T11:50:00Z'), // 10 mins ago
		});

		expect(result).toEqual({
			latitude: 37.774_93,
			longitude: -122.419_42,
		});
	});

	it('calls onPermissionDenied if permission is denied', async () => {
		const onPermissionDenied = vi.fn();
		const mockGetCurrentPosition = vi.fn((_success, error) => {
			error({
				code: 1, // PERMISSION_DENIED
				PERMISSION_DENIED: 1,
			});
		});

		vi.stubGlobal('navigator', {
			geolocation: {
				getCurrentPosition: mockGetCurrentPosition,
			},
		});

		const result = await requestAutomaticLocation({
			isLocationTrackingEnabled: true,
			onPermissionDenied,
			timestamp: new Date('2025-01-01T12:00:00Z'),
		});

		expect(result).toBeNull();
		expect(onPermissionDenied).toHaveBeenCalled();
	});

	it('returns null if window or navigator.geolocation is unavailable', async () => {
		vi.stubGlobal('navigator', {});

		const result = await requestAutomaticLocation({
			isLocationTrackingEnabled: true,
			timestamp: new Date('2025-01-01T12:00:00Z'),
		});

		expect(result).toBeNull();
	});
});
