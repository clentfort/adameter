'use client';

import { useEffect, useRef } from 'react';
import { cancelIdleCallback, requestIdleCallback } from '@/lib/idle-callback';

/**
 * A hook that executes a callback when the browser is idle.
 * Falls back to setTimeout if requestIdleCallback is not supported.
 * Automatically cleans up the callback on unmount.
 */
export function useIdleCallback(
	callback: () => void,
	deps: React.DependencyList = [],
) {
	const callbackRef = useRef(callback);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	useEffect(() => {
		const handle = requestIdleCallback(() => {
			callbackRef.current();
		});

		return () => cancelIdleCallback(handle as number);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
}
