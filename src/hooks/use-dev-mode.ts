import { STORE_VALUE_DEV_MODE } from '@/lib/tinybase-sync/constants';
import { useStoreValueSetting } from './use-store-value-setting';

export const useDevMode = () =>
	useStoreValueSetting<boolean>(STORE_VALUE_DEV_MODE, false);
