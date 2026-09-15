export const LOCATION_TIME_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

interface LocationCoordinates {
	latitude: number;
	longitude: number;
}

interface RequestAutomaticLocationOptions {
	isLocationTrackingEnabled: boolean;
	onPermissionDenied?: () => void;
	timestamp: Date | string | number;
}

/**
 * Attempts to retrieve current location if location tracking is enabled
 * and the given timestamp is within 15 minutes of current local time.
 */
export async function requestAutomaticLocation({
	isLocationTrackingEnabled,
	onPermissionDenied,
	timestamp,
}: RequestAutomaticLocationOptions): Promise<LocationCoordinates | null> {
	if (!isLocationTrackingEnabled) {
		return null;
	}

	const dateObj = new Date(timestamp);
	if (Number.isNaN(dateObj.getTime())) {
		return null;
	}

	const timeDiff = Math.abs(Date.now() - dateObj.getTime());
	if (timeDiff > LOCATION_TIME_THRESHOLD_MS) {
		return null;
	}

	if (typeof window === 'undefined' || !('geolocation' in navigator)) {
		return null;
	}

	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const latitude =
					Math.round(position.coords.latitude * 100_000) / 100_000;
				const longitude =
					Math.round(position.coords.longitude * 100_000) / 100_000;
				resolve({ latitude, longitude });
			},
			(error) => {
				if (error.code === error.PERMISSION_DENIED) {
					onPermissionDenied?.();
				}
				resolve(null);
			},
			{
				enableHighAccuracy: true,
				timeout: 10_000,
			},
		);
	});
}
