import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { STORE_VALUE_CURRENCY } from '@/lib/tinybase-sync/constants';

export type Currency = 'GBP' | 'EUR' | 'USD';

export const useCurrency = () => {
	const currency = useValue(STORE_VALUE_CURRENCY) as Currency | undefined;

	const setCurrency = useSetValueCallback(
		STORE_VALUE_CURRENCY,
		(newCurrency: Currency) => newCurrency,
		[],
	);

	return [currency ?? 'GBP', setCurrency] as const;
};
