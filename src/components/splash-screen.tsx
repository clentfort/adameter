'use client';

import Image from 'next/image';

export function SplashScreen() {
	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				backgroundColor: '#faf7ee', // From manifest.json
				zIndex: 9999, // Ensure it's on top
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
