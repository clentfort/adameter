import { useEffect, useRef } from 'react';
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

	useEffect(() => {
		if (enabled && locationTracking && !locationPromiseRef.current) {
			locationPromiseRef.current = requestAutomaticLocation({
				isLocationTrackingEnabled: locationTracking,
				onPermissionDenied: () => setLocationTracking(false),
				timestamp: timestamp ?? new Date(),
			});
		}
	}, [enabled, locationTracking, setLocationTracking, timestamp]);

	const getLocation = async (
		overrideTimestamp?: Date | number | string,
	): Promise<{ latitude: number; longitude: number } | null> => {
		if (!enabled || !locationTracking) {
			return null;
		}

		if (!locationPromiseRef.current) {
			locationPromiseRef.current = requestAutomaticLocation({
				isLocationTrackingEnabled: locationTracking,
				onPermissionDenied: () => setLocationTracking(false),
				timestamp: overrideTimestamp ?? timestamp ?? new Date(),
			});
		}

		return locationPromiseRef.current;
	};

	return { getLocation };
}
