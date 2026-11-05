'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Registers the service worker that caches the app for offline starts. The
 * build id in the URL installs a fresh worker and cache for every deploy.
 */
export function ServiceWorkerRegistration() {
	useEffect(() => {
		if (
			process.env.NODE_ENV !== 'production' ||
			!('serviceWorker' in navigator)
		) {
			return;
		}

		const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? 'local';
		navigator.serviceWorker
			.register(`/sw.js?v=${encodeURIComponent(buildId)}`, { scope: '/' })
			.catch((error: unknown) => {
				logger.error('Failed to register service worker:', error);
			});
	}, []);

	return null;
}
