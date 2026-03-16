'use client';

import { useEffect, useRef, useState } from 'react';

interface DeferredSectionProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}

export default function DeferredSection({
	children,
	fallback,
}: DeferredSectionProps) {
	const [shouldRender, setShouldRender] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const container = containerRef.current;
		if (!container) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					// We use requestIdleCallback to ensure the main thread is free
					// when we actually mount the heavy children
					const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
					ric(() => {
						setShouldRender(true);
					});
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' },
		);

		observer.observe(container);

		return () => {
			observer.disconnect();
		};
	}, []);

	if (!shouldRender) {
		return <div ref={containerRef}>{fallback}</div>;
	}

	return <>{children}</>;
}
