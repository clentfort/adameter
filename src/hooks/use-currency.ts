import { STORE_VALUE_CURRENCY } from '@/lib/tinybase-sync/constants';
import { useStoreValueSetting } from './use-store-value-setting';

export type Currency = 'GBP' | 'EUR' | 'USD';

export const useCurrency = () =>
	useStoreValueSetting<Currency>(STORE_VALUE_CURRENCY, 'GBP');
