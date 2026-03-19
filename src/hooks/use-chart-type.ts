'use client';

import { useCallback, useEffect, useState } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

export type ChartType = 'bar' | 'area';

export function useChartType() {
	const [type, setType] = useState<ChartType>('bar');

	useEffect(() => {
		const stored = getItem(STORAGE_KEYS.CHART_TYPE);
		if (stored === 'bar' || stored === 'area') {
			setType(stored);
		}
	}, []);

	const setTypeWithStorage = useCallback((value: ChartType) => {
		setType(value);
		setItem(STORAGE_KEYS.CHART_TYPE, value);
	}, []);

	return [type, setTypeWithStorage] as const;
}
