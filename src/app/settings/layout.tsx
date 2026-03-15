import type React from 'react';

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center w-full max-w-md mx-auto">
			{children}
		</div>
	);
}
