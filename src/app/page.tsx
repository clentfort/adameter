'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { useShowFeeding } from '@/hooks/use-show-feeding';

export default function HomePage() {
	const [showFeeding] = useShowFeeding();
	const router = useRouter();

	useEffect(() => {
		if (showFeeding === undefined) {
			return;
		}

		if (showFeeding) {
			router.replace('/feeding');
		} else {
			router.replace('/diaper');
		}
	}, [showFeeding, router]);

	return <SplashScreen />;
}
