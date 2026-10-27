import { STORE_VALUE_CURRENCY } from '@/lib/tinybase-sync/constants';
import { useStoreValueSetting } from './use-store-value-setting';

export const CURRENCIES = ['GBP', 'EUR', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

const DEFAULT_CURRENCY: Currency = 'GBP';

function isCurrency(value: unknown): value is Currency {
	return (CURRENCIES as readonly unknown[]).includes(value);
}

export function useCurrency() {
	const [stored, setCurrency] = useStoreValueSetting<Currency>(
		STORE_VALUE_CURRENCY,
		DEFAULT_CURRENCY,
	);
	return [isCurrency(stored) ? stored : DEFAULT_CURRENCY, setCurrency] as const;
}
