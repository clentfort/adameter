'use client';

import { useCallback, useEffect, useState } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';

export function useShowComparisonCharts() {
	const [show, setShow] = useState<boolean>(true);

	useEffect(() => {
		const stored = getItem(STORAGE_KEYS.SHOW_COMPARISON_CHARTS);
		if (stored !== null) {
			setShow(stored === 'true');
		}
	}, []);

	const setShowWithStorage = useCallback((value: boolean) => {
		setShow(value);
		setItem(STORAGE_KEYS.SHOW_COMPARISON_CHARTS, String(value));
	}, []);

	return [show, setShowWithStorage] as const;
}
