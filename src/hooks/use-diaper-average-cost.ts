import { useCallback, useContext, useMemo } from 'react';
import { useValue } from 'tinybase/ui-react';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { STORE_VALUE_DIAPER_AVERAGE_COST } from '@/lib/tinybase-sync/constants';

export const useDiaperAverageCost = () => {
	const { store } = useContext(tinybaseContext);
	const current = useValue(STORE_VALUE_DIAPER_AVERAGE_COST, store);

	const value = useMemo(() => {
		if (typeof current === 'number') return current;
		if (typeof current === 'string') return Number.parseFloat(current) || 0;
		return 0;
	}, [current]);

	const set = useCallback(
		(nextValue: number) => {
			store.setValue(STORE_VALUE_DIAPER_AVERAGE_COST, nextValue);
		},
		[store],
	);

	return [value, set] as const;
};
