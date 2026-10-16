import { STORE_VALUE_LOCATION_TRACKING } from '@/lib/tinybase-sync/constants';
import { useStoreValueSetting } from './use-store-value-setting';

export const useLocationTracking = () =>
	useStoreValueSetting<boolean>(STORE_VALUE_LOCATION_TRACKING, true);
