'use client';

import { useEffect, useState } from 'react';

interface DeferredSectionProps {
	children: React.ReactNode;
	fallback: React.ReactNode;
}
export default function DeferredSection({
	children,
	fallback,
}: DeferredSectionProps) {
	const [shouldRender, setShouldRender] = useState(false);
	useEffect(() => {
		if (typeof window === 'undefined') return;

		const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
		const cic = window.cancelIdleCallback || ((id) => clearTimeout(id));

		const handle = ric(() => {
			setShouldRender(true);
		});
		return () => cic(handle);
	}, []);
	if (!shouldRender) {
		return <>{fallback}</>;
	}
	return <>{children}</>;
}
