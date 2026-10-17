import type { RefObject } from 'react';
import { useEffect } from 'react';

export function useHeaderScrollProgress(
	ref: RefObject<HTMLElement | null>,
	threshold = 144,
): void {
	useEffect(() => {
		const handleScroll = () => {
			if (!ref.current) return;
			const scrollY = window.scrollY;
			const progress = Math.min(1, Math.max(0, scrollY / threshold));
			ref.current.style.setProperty(
				'--header-scroll-progress',
				progress.toString(),
			);
		};

		window.addEventListener('scroll', handleScroll);
		handleScroll(); // Initial call
		return () => window.removeEventListener('scroll', handleScroll);
	}, [ref, threshold]);
}
