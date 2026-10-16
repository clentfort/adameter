import { STORE_VALUE_SHOW_FEEDING } from '@/lib/tinybase-sync/constants';
import { useStoreValueSetting } from './use-store-value-setting';

export const useShowFeeding = () =>
	useStoreValueSetting<boolean>(STORE_VALUE_SHOW_FEEDING, true);
