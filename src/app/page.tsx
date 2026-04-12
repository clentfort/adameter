'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { useShowFeeding } from '@/hooks/use-show-feeding';

export default function HomePage() {
	const [showFeeding] = useShowFeeding();

	useEffect(() => {
		if (showFeeding) {
			redirect('/feeding');
		} else {
			redirect('/diaper');
		}
	}, [showFeeding]);

	return <SplashScreen />;
}
