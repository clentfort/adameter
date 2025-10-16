'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { SplashScreen } from '@/components/splash-screen';

export default function HomePage() {
	useEffect(() => {
		redirect('/feeding');
	}, []);

	return <SplashScreen />;
}