import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { STORE_VALUE_LOCATION_TRACKING } from '@/lib/tinybase-sync/constants';

export const useLocationTracking = () => {
	const locationTracking = useValue(STORE_VALUE_LOCATION_TRACKING) as
		boolean | undefined;

	// Default value is true
	const effectiveLocationTracking = locationTracking ?? true;

	const setLocationTracking = useSetValueCallback(
		STORE_VALUE_LOCATION_TRACKING,
		(newValue: boolean) => newValue,
		[],
	);

	return [effectiveLocationTracking, setLocationTracking] as const;
};
