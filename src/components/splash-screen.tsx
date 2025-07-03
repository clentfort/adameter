'use client';

import Image from 'next/image';

export function SplashScreen() {
	return (
		<div
			style={{
				alignItems: 'center',
				backgroundColor: '#faf7ee',
				display: 'flex',
				flexDirection: 'column',
				height: '100vh',
				justifyContent: 'center',
				left: 0,
				position: 'fixed',
				top: 0,
				width: '100vw',
				zIndex: 9999,
			}}
		>
			<Image
				alt="AdaMeter Logo"
				height={256}
				src="/icon-512x512.png"
				width={256}
			/>
		</div>
	);
}
