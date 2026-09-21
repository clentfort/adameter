'use client';

import { useEffect } from 'react';
import { useFullscreen } from '@/hooks/use-fullscreen';

export function FullscreenHandler() {
	const { fullscreenMode } = useFullscreen();

	useEffect(() => {
		if (!fullscreenMode || typeof window === 'undefined') {
			return;
		}

		const handleUserInteraction = () => {
			if (
				document.fullscreenElement ||
				!document.documentElement?.requestFullscreen
			) {
				return;
			}

			document.documentElement.requestFullscreen().catch(() => {
				// Browser policy may block fullscreen if gesture is insufficient or blocked
			});
		};

		window.addEventListener('pointerdown', handleUserInteraction);
		window.addEventListener('click', handleUserInteraction);

		return () => {
			window.removeEventListener('pointerdown', handleUserInteraction);
			window.removeEventListener('click', handleUserInteraction);
		};
	}, [fullscreenMode]);

	return null;
}
