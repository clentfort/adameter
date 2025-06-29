'use client';

import Image from 'next/image';

export function SplashScreen() {
	return (
		<div
			style={{
				alignItems: 'center',
				backgroundColor: '#faf7ee', // From manifest.json
				display: 'flex',
				flexDirection: 'column',
				height: '100vh',
				justifyContent: 'center',
				left: 0,
				position: 'fixed',
				top: 0,
				width: '100vw',
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
