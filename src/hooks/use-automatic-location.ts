import { useCallback, useEffect, useRef } from 'react';
import { useLocationTracking } from '@/hooks/use-location-tracking';
import { requestAutomaticLocation } from '@/utils/get-automatic-location';

export interface UseAutomaticLocationOptions {
	enabled?: boolean;
	timestamp?: Date | number | string;
}

export function useAutomaticLocation({
	enabled = true,
	timestamp,
}: UseAutomaticLocationOptions = {}) {
	const [locationTracking, setLocationTracking] = useLocationTracking();
	const locationPromiseRef = useRef<Promise<{
		latitude: number;
		longitude: number;
	} | null> | null>(null);

	const startRequest = useCallback(
		(reqTimestamp: Date | number | string) => {
			const promise = requestAutomaticLocation({
				isLocationTrackingEnabled: locationTracking,
				onPermissionDenied: () => setLocationTracking(false),
				timestamp: reqTimestamp,
			});
			locationPromiseRef.current = promise;
			return promise;
		},
		[locationTracking, setLocationTracking],
	);

	useEffect(() => {
		if (enabled && locationTracking && !locationPromiseRef.current) {
			startRequest(timestamp ?? new Date());
		}
	}, [enabled, locationTracking, startRequest, timestamp]);

	const getLocation = useCallback(
		async (
			overrideTimestamp?: Date | number | string,
		): Promise<{ latitude: number; longitude: number } | null> => {
			if (!enabled || !locationTracking) {
				return null;
			}

			if (!locationPromiseRef.current) {
				return startRequest(overrideTimestamp ?? timestamp ?? new Date());
			}

			return locationPromiseRef.current;
		},
		[enabled, locationTracking, startRequest, timestamp],
	);

	const resolveLocation = useCallback(
		async (
			latitude: number | undefined,
			longitude: number | undefined,
			overrideTimestamp?: Date | number | string,
		): Promise<{ latitude?: number; longitude?: number }> => {
			if (latitude !== undefined || longitude !== undefined) {
				return { latitude, longitude };
			}
			return (await getLocation(overrideTimestamp)) ?? {};
		},
		[getLocation],
	);

	return { getLocation, resolveLocation };
}
