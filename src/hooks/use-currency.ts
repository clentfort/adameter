import { useCallback, useContext, useMemo } from 'react';
import { useValue } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { STORE_VALUE_CURRENCY } from '@/lib/tinybase-sync/constants';

export const useCurrency = () => {
	const { store } = useContext(tinybaseContext);
	const current = useValue(STORE_VALUE_CURRENCY, store);

	const value = useMemo(() => {
		if (typeof current === 'string') return current;
		return 'GBP';
	}, [current]);

	const set = useCallback(
		(nextValue: string) => {
			store.setValue(STORE_VALUE_CURRENCY, nextValue);
		},
		[store],
	);

	const symbol = useMemo(() => {
		switch (value) {
			case 'EUR':
				return '€';
			case 'USD':
				return '$';
			case 'GBP':
			default:
				return '£';
		}
	}, [value]);

	return [value, set, symbol] as const;
};
