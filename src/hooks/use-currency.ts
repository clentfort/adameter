import { useCallback, useContext } from 'react';
import { useValue } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { STORE_VALUE_CURRENCY } from '@/lib/tinybase-sync/constants';

export type Currency = 'GBP' | 'EUR' | 'USD';

export const useCurrency = () => {
	const { store } = useContext(tinybaseContext);
	const currency = useValue(STORE_VALUE_CURRENCY, store) as Currency | undefined;

	const setCurrency = useCallback(
		(newCurrency: Currency) => {
			store.setValue(STORE_VALUE_CURRENCY, newCurrency);
		},
		[store],
	);

	return [currency ?? 'GBP', setCurrency] as const;
};
