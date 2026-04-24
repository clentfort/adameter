'use client';

import { useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { tinybaseContext } from '@/contexts/tinybase-context';
import { useShowFeeding } from '@/hooks/use-show-feeding';

export default function HomePage() {
	const [showFeeding] = useShowFeeding();
	const { isSyncReady } = useContext(tinybaseContext);
	const router = useRouter();

	useEffect(() => {
		if (!isSyncReady) {
			return;
		}

		if (showFeeding === false) {
			router.replace('/diaper');
		} else if (showFeeding === true) {
			router.replace('/feeding');
		} else {
			// If it's undefined, it's a new user or missing setting.
			// We wait for a very short moment to allow any init scripts to run
			// in case we are in an E2E test environment.
			const timer = setTimeout(() => {
				router.replace('/feeding');
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [showFeeding, router, isSyncReady]);

	return <SplashScreen />;
}
