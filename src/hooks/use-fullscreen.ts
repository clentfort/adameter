'use client';

import { useEffect, useState } from 'react';
import { useSetValueCallback, useValue } from 'tinybase/ui-react';
import { logger } from '@/lib/logger';
import { STORE_VALUE_FULLSCREEN_MODE } from '@/lib/tinybase-sync/constants';

export const useFullscreen = () => {
	const fullscreenMode = useValue(STORE_VALUE_FULLSCREEN_MODE) as
		boolean | undefined;

	const setFullscreenModeCallback = useSetValueCallback(
		STORE_VALUE_FULLSCREEN_MODE,
		(newMode: boolean) => newMode,
		[],
	);

	const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
		if (typeof document === 'undefined') return false;
		return Boolean(document.fullscreenElement);
	});

	useEffect(() => {
		if (typeof document === 'undefined') return;

		const handleFullscreenChange = () => {
			setIsFullscreen(Boolean(document.fullscreenElement));
		};

		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
		};
	}, []);

	const enterFullscreen = async () => {
		setFullscreenModeCallback(true);
		if (
			typeof document !== 'undefined' &&
			document.documentElement?.requestFullscreen
		) {
			try {
				if (!document.fullscreenElement) {
					await document.documentElement.requestFullscreen();
				}
			} catch (error) {
				// Fullscreen request may be blocked or unsupported in test/headless environments
				logger.warn('Failed to enter fullscreen mode:', error);
			}
		}
	};

	const exitFullscreen = async () => {
		setFullscreenModeCallback(false);
		if (typeof document !== 'undefined' && document.exitFullscreen) {
			try {
				if (document.fullscreenElement) {
					await document.exitFullscreen();
				}
			} catch (error) {
				logger.warn('Failed to exit fullscreen mode:', error);
			}
		}
	};

	return {
		enterFullscreen,
		exitFullscreen,
		fullscreenMode: fullscreenMode ?? true,
		isFullscreen,
		setFullscreenMode: setFullscreenModeCallback,
	};
};
