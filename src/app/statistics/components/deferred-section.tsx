'use client';

import { useEffect, useRef, useState } from 'react';
import { useIdleCallback } from '@/hooks/use-idle-callback';

interface DeferredSectionProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}

export default function DeferredSection({
	children,
	fallback,
}: DeferredSectionProps) {
	const [isIntersecting, setIsIntersecting] = useState(false);
	const [shouldRender, setShouldRender] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const container = containerRef.current;
		if (!container) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setIsIntersecting(true);
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

	useIdleCallback(() => {
		if (isIntersecting) {
			setShouldRender(true);
		}
	}, [isIntersecting]);

	if (!shouldRender) {
		return <div ref={containerRef}>{fallback}</div>;
	}

	return <>{children}</>;
}
